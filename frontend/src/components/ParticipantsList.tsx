import { Participant } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-4 w-4" aria-label="Users" />
        <span className="text-sm font-medium">{participants.length}</span>
      </div>
      
      <div className="flex -space-x-2">
        {participants.slice(0, 5).map((participant) => (
          <Tooltip key={participant.id}>
            <TooltipTrigger asChild>
              <div className="relative cursor-pointer">
                <Avatar 
                  className="h-8 w-8 border-2 border-background ring-1 transition-transform hover:scale-110 hover:z-10"
                  style={{ borderColor: participant.color }}
                >
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback 
                    className="text-xs font-medium"
                    style={{ backgroundColor: participant.color + '30', color: participant.color }}
                  >
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {participant.isOnline && (
                  <span 
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: participant.isTyping ? participant.color : 'hsl(var(--online))' }}
                  />
                )}
                {participant.isTyping && (
                  <span 
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-ping rounded-full"
                    style={{ backgroundColor: participant.color }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent 
              className="border-border bg-popover"
              style={{ borderColor: participant.color + '50' }}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: participant.color }}
                />
                <span className="font-medium">{participant.name}</span>
                {participant.isTyping && (
                  <span className="text-xs text-muted-foreground">typing...</span>
                )}
              </div>
              {participant.cursor && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Line {participant.cursor.lineNumber}, Col {participant.cursor.column}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        
        {participants.length > 5 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
            +{participants.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
