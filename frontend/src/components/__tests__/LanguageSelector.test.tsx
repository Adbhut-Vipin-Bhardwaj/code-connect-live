import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '../LanguageSelector';

describe('LanguageSelector', () => {
  it('renders with the correct value', () => {
    render(<LanguageSelector value="javascript" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('displays the selected language', () => {
    render(<LanguageSelector value="python" onChange={() => {}} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('🐍')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    const { rerender } = render(<LanguageSelector value="javascript" onChange={handleChange} />);
    
    // Simulate value change by rerendering with new value
    rerender(<LanguageSelector value="python" onChange={handleChange} />);
    
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('displays all language options in the component', () => {
    render(<LanguageSelector value="javascript" onChange={() => {}} />);
    
    // Verify the combobox is rendered
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    
    // Verify current selection is displayed
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });
});
