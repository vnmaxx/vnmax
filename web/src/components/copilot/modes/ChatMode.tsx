import type { UseCopilotReturn } from '../../../hooks/useCopilot';
import { Icon } from '../Icons';

export function ChatMode({ copilot }: { copilot: UseCopilotReturn }) {
  const quickActions = [
    { iconName: 'building', label: 'Sobre a VNMAX', prompt: 'Conte-me sobre a VNMAX' },
    { iconName: 'cpu', label: 'Serviços de IA', prompt: 'Quais serviços de IA a VNMAX oferece?' },
    { iconName: 'wrench', label: 'Automação', prompt: 'Como a VNMAX pode ajudar com automação?' },
    { iconName: 'dollar', label: 'Orçamento', prompt: 'Como funciona o orçamento de projetos?' },
    { iconName: 'phone', label: 'Contato', prompt: 'Como posso entrar em contato?' },
    { iconName: 'star', label: 'Diferenciais', prompt: 'Quais são os diferenciais da VNMAX?' },
  ];

  const handleQuickAction = (prompt: string) => {
    copilot.sendMessage(prompt, '/api/chat');
  };

  return (
    <div className="border-t px-4 py-3" style={{ borderColor: 'rgba(65, 232, 255, 0.08)' }}>
      <p className="mb-3 font-mono text-xs text-white/40">Ações rápidas</p>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs text-white/70 transition-all hover:bg-white/5 hover:text-white/90"
            style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <Icon name={action.iconName} className="h-4 w-4 shrink-0" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}