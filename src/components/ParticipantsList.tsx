import { Participant } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface ParticipantsListProps {
  participants: Participant[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">{participants.length}</span>
      </div>
      
      <div className="flex -space-x-2">
        {participants.slice(0, 5).map((participant) => (
          <div key={participant.id} className="relative">
            <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-border">
              <AvatarImage src={participant.avatar} alt={participant.name} />
              <AvatarFallback className="bg-muted text-xs">
                {participant.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {participant.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-online" />
            )}
          </div>
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
