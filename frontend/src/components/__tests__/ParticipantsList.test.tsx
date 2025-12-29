import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParticipantsList } from '../ParticipantsList';
import { Participant } from '@/services/api';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    color: '#00d4ff',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    color: '#ff6b6b',
    isOnline: true,
    isTyping: true,
  },
  {
    id: '3',
    name: 'Charlie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    color: '#4ecdc4',
    isOnline: false,
  },
];

describe('ParticipantsList', () => {
  it('renders the correct number of participants', () => {
    render(
      <TooltipProvider>
        <ParticipantsList participants={mockParticipants} />
      </TooltipProvider>
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays participant count with users icon', () => {
    render(
      <TooltipProvider>
        <ParticipantsList participants={mockParticipants} />
      </TooltipProvider>
    );
    
    const usersIcon = screen.getByRole('img', { hidden: true });
    expect(usersIcon).toBeInTheDocument();
  });

  it('renders all participants when count is 5 or less', () => {
    render(
      <TooltipProvider>
        <ParticipantsList participants={mockParticipants} />
      </TooltipProvider>
    );
    
    const avatars = screen.getAllByRole('img');
    // Filter out the Users icon
    const participantAvatars = avatars.filter(img => img.getAttribute('alt'));
    expect(participantAvatars.length).toBe(3);
  });

  it('shows overflow indicator when more than 5 participants', () => {
    const manyParticipants: Participant[] = Array.from({ length: 7 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      color: '#00d4ff',
      isOnline: true,
    }));

    render(
      <TooltipProvider>
        <ParticipantsList participants={manyParticipants} />
      </TooltipProvider>
    );
    
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders empty list when no participants', () => {
    render(
      <TooltipProvider>
        <ParticipantsList participants={[]} />
      </TooltipProvider>
    );
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
