import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '../LanguageSelector';

describe('LanguageSelector', () => {
  it('renders with the correct value', () => {
    render(<LanguageSelector value="javascript" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onChange when a language is selected', async () => {
    const user = userEvent.setup();
    let selectedValue = '';
    const handleChange = (value: string) => {
      selectedValue = value;
    };

    render(<LanguageSelector value="javascript" onChange={handleChange} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const pythonOption = await screen.findByText('Python');
    await user.click(pythonOption);
    
    expect(selectedValue).toBe('python');
  });

  it('displays all supported languages', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector value="javascript" onChange={() => {}} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(await screen.findByText('JavaScript')).toBeInTheDocument();
    expect(await screen.findByText('TypeScript')).toBeInTheDocument();
    expect(await screen.findByText('Python')).toBeInTheDocument();
    expect(await screen.findByText('Java')).toBeInTheDocument();
    expect(await screen.findByText('C++')).toBeInTheDocument();
  });
});
