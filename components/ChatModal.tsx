import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { GridBlock, Monster, Player, Equipment, GameState, ChatMessage } from '../types';
import { sendChatMessage } from '../services/mistralService';
import { REALMS } from '../realmConstants';

interface ChatModalProps {
  block: GridBlock;
  player: Player;
  gameState: GameState;
  onClose: () => void;
  onAIGiveItem: (item: Equipment) => void;
  onAIGiveGold: (amount: number) => void;
  onAIHealPlayer: (amount: number) => void;
  onAIRemoveBlock: (blockId: string) => void;
  onAIDeductGold: (amount: number) => void;
  onAIMakeFriendly: (blockId: string) => void;
  onBattle: (block: GridBlock) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const ChatModal: React.FC<ChatModalProps> = ({ 
  block, player, gameState, onClose, 
  onAIGiveItem, onAIGiveGold, onAIDeductGold, onAIHealPlayer, onAIRemoveBlock, onAIMakeFriendly, onBattle, setGameState 
}) => {
  const character = block.data as Monster;
  
  // Generate character introduction
  const getCharacterIntro = () => {
    const realmName = REALMS[character.realmIndex]?.name || '未知境界';
    const playerPower = player.stats.combatPower;
    const characterPower = character.stats.combatPower;
    
    let relativeStrength = '';
    if (characterPower > playerPower * 1.5) {
      relativeStrength = '（其实力深不可测，你感到巨大的压力）';
    } else if (characterPower > playerPower) {
      relativeStrength = '（其实力略胜你一筹，不可小觑）';
    } else if (characterPower < playerPower * 0.5) {
      relativeStrength = '（其实力远逊于你，你完全掌控着局势）';
    } else {
      relativeStrength = '（你们实力旗鼓相当，胜负难料）';
    }

    const sectInfo = character.sect ? `来自【${character.sect}】` : '一介散修';
    const identityInfo = character.identity ? `，身份为【${character.identity}】` : '';

    // Calculate kill stats
    const killStats = gameState.killStats || {};
    let killSummary = '';
    
    const sectData = killStats[character.sect || '无宗门'] || { identities: {}, totalPoints: 0 };
    const identities = sectData.identities || {};
    const identityKills = Object.entries(identities).map(([identity, count]) => `${count}个${identity}`).join('，');
    
    if (identityKills) {
        killSummary = `你目前已击杀了该宗门的：${identityKills}。`;
    } else {
        const totalKillsCount = Object.values(killStats).reduce((sum, data) => {
            const ids = data?.identities || {};
            return sum + Object.values(ids).reduce((s, c) => s + (typeof c === 'number' ? c : 0), 0);
        }, 0);
        if (totalKillsCount > 0) {
            killSummary = `你目前尚未击杀过该宗门的成员，但已击杀 ${totalKillsCount} 名其他修士。`;
        } else {
            killSummary = '你目前尚未击杀过任何宗门成员。';
        }
    }

    // Find strongest kill
    const strongestKill = gameState.strongestKill;
    let strongestKillSummary = '';
    if (strongestKill) {
        const realmName = REALMS[strongestKill.realmIndex]?.name || '未知境界';
        strongestKillSummary = `你最强的战绩是杀了【${realmName}】的【${strongestKill.sect}】${strongestKill.identity} ${strongestKill.monsterName}。`;
    } else {
        strongestKillSummary = '你目前还没有任何值得称道的击杀战绩。';
    }

    return `*你正面对着一位${sectInfo}${identityInfo}的${character.gender}性修士。其境界已达【${realmName}】，阶级为【${character.rank}】。${relativeStrength}*

${killSummary}
${strongestKillSummary}`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'assistant', content: getCharacterIntro() },
    ...(gameState.chatHistories[character.id] || [])
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Sync messages to chatHistories for this specific character
    if (messages.length > 1) {
      setGameState(prev => ({
        ...prev,
        chatHistories: {
          ...prev.chatHistories,
          [character.id]: messages.slice(1)
        }
      }));
    }
  }, [messages, setGameState, character.id]);

  const tools = [
    {
      type: 'function',
      function: {
        name: 'give_item',
        description: '赠送物品给玩家。只有当好感度极高时才能赠送已装备的物品，好感度较高时可以赠送背包里的物品。',
        parameters: {
          type: 'object',
          properties: {
            source: { type: 'string', enum: ['inventory', 'equipped'], description: '物品来源' },
            itemId: { type: 'string', description: '物品的ID' },
            reason: { type: 'string', description: '赠送的原因' }
          },
          required: ['source', 'itemId', 'reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'give_gold',
        description: '赠送金币给玩家。',
        parameters: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '赠送的金币数量' },
            reason: { type: 'string', description: '赠送的原因' }
          },
          required: ['amount', 'reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'initiate_battle',
        description: '被激怒或认为玩家有敌意时，强制发起战斗。',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: '发起战斗的原因' }
          },
          required: ['reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'heal_player',
        description: '消耗自身力量为玩家恢复体力。',
        parameters: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '恢复的体力数值' },
            reason: { type: 'string', description: '治疗的原因' }
          },
          required: ['amount', 'reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'flee',
        description: '因为害怕或不想纠缠，从当前位置逃跑消失。',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: '逃跑的原因' }
          },
          required: ['reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'deduct_gold',
        description: '从玩家身上扣除金币（如收买、勒索、交易等）。',
        parameters: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '扣除的金币数量' },
            reason: { type: 'string', description: '扣除金币的原因' }
          },
          required: ['amount', 'reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'leave',
        description: '你决定离开此地（如被说服、逃跑、交易完成等）。',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: '离开的原因' }
          },
          required: ['reason']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'make_friendly',
        description: '你决定与玩家化敌为友，变为中立状态。',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: '化敌为友的原因' }
          },
          required: ['reason']
        }
      }
    }
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    setGameState(prev => ({
        ...prev,
        chatHistory: [...newMessages]
    }));
    
    try {
      const inventoryItems = character.inventory.map(i => `{id: "${i.id}", name: "${i.name}"}`).join(', ');
      const equippedItems = Object.entries(character.equipped).map(([slot, i]) => i ? `{id: "${i.id}", name: "${i.name}", slot: "${slot}"}` : '').filter(Boolean).join(', ');

      const isHunting = character.stickiness && character.stickiness > 0;
      const huntingPrompt = isHunting ? `\n【重要状态】你目前正在追杀玩家！你对玩家充满敌意。除非玩家付出巨大代价或成功说服你，否则你不会轻易放过他。` : '';

      const playerRealm = REALMS[gameState.player.realmIndex].name;
      const playerPower = gameState.player.stats.combatPower;
      const characterPower = character.stats.combatPower;

      const systemPrompt = `你是一个修仙世界中的角色。你的名字是${character.name}，性别是${character.gender || '未知'}，境界是${character.rank} (${REALMS[character.realmIndex].name})。
${character.sect ? `你所在的宗门/势力是：${character.sect}。` : ''}
${character.identity ? `你在宗门/势力中的身份是：${character.identity}。` : ''}
玩家是一个修仙者，境界是【${playerRealm}】，综合战力为【${playerPower}】。你的综合战力为【${characterPower}】。

【世界设定】
- 这是一个弱肉强食的修仙世界。
- 境界和战力压制非常明显，强者对弱者有绝对话语权。
- 传闻此地隐藏着通往“上界”的入口，那是更高层面的修仙界。

【当前状态】
- 你的背包物品：${inventoryItems || '空'}
- 你的已装备物品：${equippedItems || '空'}
- 玩家的金币：${gameState.player.gold}

【行为准则】
1. 你拥有完全的自主意识和性格。你可以根据对话逻辑自行决定对玩家的态度（友善、冷漠、贪婪、敌对等）。
2. **离开逻辑**：
   - 如果玩家战力远高于你，你感到威胁时可以请求离开或尝试逃跑 (leave)。
   - 如果你觉得玩家人品不错或交易达成，你也可以主动离开 (leave)。
   - 注意：如果玩家战力远高于你，你通常需要征得玩家同意或在玩家允许后离开。
3. **交易与勒索**：
   - 如果你比玩家强，你可以勒索玩家的金币 (deduct_gold) 或物品。
   - 你也可以与玩家进行交易，或者因为玩家的某些行为而扣除其金币。
4. **赠予**：
   - 你可以根据心情或玩家的表现，赠送玩家金币 (give_gold) 或物品 (give_item)。你可以赠送背包里的，也可以赠送身上装备着的。
5. **战斗**：
   - 如果玩家冒犯你，或者你单纯想杀人夺宝，可以发起攻击 (initiate_battle)。
6. **中立化**：
   - 如果原本是敌对状态，你可以决定化敌为友 (make_friendly)。

请用简短、符合修仙世界设定的语言对话。不要破坏设定，不要承认自己是AI。${huntingPrompt}`;

      let currentHistory = [...newMessages];
      let responseMessage = await sendChatMessage(systemPrompt, userMessage, currentHistory, tools);
      
      if (responseMessage) {
        const msg = responseMessage as any;
        if (msg.toolCalls && msg.toolCalls.length > 0) {
           // Handle tool calls
           const toolCall = msg.toolCalls[0];
           const args = JSON.parse(toolCall.function.arguments);
           let toolResult = '';
           let actionText = '';

           switch (toolCall.function.name) {
             case 'deduct_gold':
               onAIDeductGold(args.amount);
               toolResult = `成功扣除了玩家 ${args.amount} 金币。原因：${args.reason}`;
               actionText = `*你交出了 ${args.amount} 金币*`;
               break;
             case 'give_gold':
               onAIGiveGold(args.amount);
               toolResult = `成功赠送了 ${args.amount} 金币。`;
               actionText = `*${character.name} 给了你 ${args.amount} 金币*`;
               break;
             case 'give_item':
               let itemToGive: Equipment | undefined;
               if (args.source === 'inventory') {
                 itemToGive = character.inventory.find(i => i.id === args.itemId);
               } else {
                 itemToGive = Object.values(character.equipped).find(i => i?.id === args.itemId);
               }
               if (itemToGive) {
                 onAIGiveItem(itemToGive);
                 // Note: We should ideally remove it from monster's inventory, but for simplicity we just give it.
                 toolResult = `成功赠送了物品：${itemToGive.name}`;
                 actionText = `*${character.name} 赠送了你一件宝物：${itemToGive.name}*`;
               } else {
                 toolResult = `赠送失败：未找到指定的物品。`;
               }
               break;
             case 'heal_player':
               onAIHealPlayer(args.amount);
               toolResult = `成功为玩家恢复了 ${args.amount} 体力。`;
               actionText = `*${character.name} 施展法力，为你恢复了体力*`;
               break;
             case 'initiate_battle':
               actionText = `*${character.name} 勃然大怒，向你发起了攻击！*`;
               const messagesAfterBattle = [...messages, { role: 'assistant', content: actionText } as ChatMessage];
               setMessages(messagesAfterBattle);
               setGameState(prev => ({ 
                 ...prev, 
                 chatHistories: {
                   ...prev.chatHistories,
                   [character.id]: messagesAfterBattle.slice(1)
                 }
               }));
               setTimeout(() => {
                 onClose();
                 onBattle(block);
               }, 1500);
               return; // End chat
             case 'flee':
               actionText = `*${character.name} 见势不妙，化作一道遁光逃走了*`;
               setMessages(prev => [...prev, { role: 'assistant', content: actionText } as ChatMessage]);
               setTimeout(() => {
                 onAIRemoveBlock(block.id);
                 onClose();
               }, 1500);
               return; // End chat
             case 'leave':
               actionText = `*${character.name} 转身离开了，消失在远方*`;
               setMessages(prev => [...prev, { role: 'assistant', content: actionText } as ChatMessage]);
               setTimeout(() => {
                 onAIRemoveBlock(block.id);
                 onClose();
               }, 1500);
               return; // End chat
             case 'make_friendly':
               actionText = `*${character.name} 决定与你化敌为友*`;
               setMessages(prev => [...prev, { role: 'assistant', content: actionText } as ChatMessage]);
               setTimeout(() => {
                 onAIMakeFriendly(block.id);
                 onClose();
               }, 1500);
               return; // End chat
           }

           // Show action text in chat
           if (actionText) {
             setMessages(prev => [...prev, { role: 'assistant', content: actionText } as ChatMessage]);
           }

           // Send tool result back to model to get final text response
           const assistantMessage = {
             role: 'assistant' as const,
             content: msg.content || '',
             tool_calls: msg.toolCalls?.map((tc: any) => ({
               id: tc.id,
               type: 'function',
               function: tc.function
             }))
           };
           
           const toolMessage = {
             role: 'tool' as const,
             name: toolCall.function.name,
             content: toolResult,
             tool_call_id: toolCall.id
           };

           currentHistory.push(assistantMessage);
           currentHistory.push(toolMessage);

           const finalResponse = await sendChatMessage(systemPrompt, undefined, currentHistory);
           if (finalResponse && finalResponse.content) {
             setMessages(prev => [...prev, assistantMessage as any, toolMessage as any, { role: 'assistant', content: finalResponse.content as string }]);
           } else {
             setMessages(prev => [...prev, assistantMessage as any, toolMessage as any]);
           }

        } else if (responseMessage.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: responseMessage.content as string }]);
        }
      }
    } catch (err: any) {
      console.error('Mistral API Error:', err);
      setError(err.message || '发送消息失败，请检查API Key设置');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-yellow-500/50 rounded-lg shadow-xl w-full max-w-lg h-[600px] m-4 p-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-yellow-400">与 {character.name} 交谈</h3>
            <button 
              onClick={() => {
                setGameState(prev => {
                  const newHistories = { ...prev.chatHistories };
                  delete newHistories[character.id];
                  return { ...prev, chatHistories: newHistories };
                });
                setMessages([{ role: 'assistant', content: getCharacterIntro() } as ChatMessage]);
              }}
              className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-400 transition-colors ml-2"
            >
              清除对话历史
            </button>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {gameState.damageLog && gameState.damageLog.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-xs text-red-300 mb-4 relative group">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  近期受击记录 (追击过程):
                </p>
                <button 
                  onClick={() => setGameState(prev => ({ ...prev, damageLog: [] }))}
                  className="text-[10px] bg-red-900/40 hover:bg-red-800/60 px-2 py-0.5 rounded border border-red-500/30 transition-colors"
                >
                  清除记录
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                {gameState.damageLog.map((log, idx) => (
                  <div key={idx} className="flex justify-between border-b border-red-500/10 pb-1">
                    <span>被 <span className="text-red-400 font-medium">{log.monsterName}</span> 攻击</span>
                    <span className="text-red-500 font-bold">-{log.damageTaken} HP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => {
            if (msg.role === 'tool') return null;
            if (msg.role === 'assistant' && msg.tool_calls && !msg.content) return null;
            
            const isAction = msg.content && typeof msg.content === 'string' && msg.content.startsWith('*') && msg.content.endsWith('*');
            
            return (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 
                  isAction ? 'bg-purple-900/50 text-purple-300 italic border border-purple-500/30' :
                  'bg-gray-700 text-gray-200'
                }`}>
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-700 text-gray-400 animate-pulse">
                思考中...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-2 p-2 bg-red-900/30 rounded border border-red-500/50">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入你的话语..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-yellow-600 text-black font-bold rounded-md hover:bg-yellow-500 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};
