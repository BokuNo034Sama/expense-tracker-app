import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingStep2, OCCUPATION_OPTIONS } from './OnboardingStep2';

describe('OnboardingStep2 Component', () => {
  it('renders all occupation/track options', () => {
    render(<OnboardingStep2 selectedId="" onSelect={() => {}} />);

    expect(screen.getByText('SELECT_YOUR_TRACK')).toBeDefined();
    
    OCCUPATION_OPTIONS.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeDefined();
      expect(screen.getByText(opt.desc)).toBeDefined();
    });
  });

  it('renders active tag when an option is selected', () => {
    const selectedOption = OCCUPATION_OPTIONS[0];
    render(<OnboardingStep2 selectedId={selectedOption.id} onSelect={() => {}} />);

    const activeTags = screen.getAllByText('Active');
    expect(activeTags.length).toBe(1);
  });

  it('calls onSelect when a track card is clicked', () => {
    const onSelectMock = vi.fn();
    render(<OnboardingStep2 selectedId="" onSelect={onSelectMock} />);

    const targetOption = OCCUPATION_OPTIONS[2]; // Student / Hustler
    const button = screen.getByText(targetOption.label).closest('button');
    expect(button).toBeDefined();

    if (button) {
      fireEvent.click(button);
    }

    expect(onSelectMock).toHaveBeenCalledWith(targetOption.id, targetOption.label);
  });
});
