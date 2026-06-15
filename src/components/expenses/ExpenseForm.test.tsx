import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';
import { useAppStore } from '../../store';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Supabase client
vi.mock('../../lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn().mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }))
    },
    getUID: vi.fn().mockResolvedValue('test-user-id'),
  };
});

// Mock global fetch for Gemini API REST calls
global.fetch = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  vendor: 'Ingested Merchant',
                  amount: 4500.00,
                  date: '2026-06-12',
                  memo: 'Test Ingest',
                  category_suggestion: 'food'
                })
              }
            ]
          }
        }
      ]
    })
  });
});

describe('ExpenseForm - QA / Regression Tests', () => {
  beforeEach(() => {
    // Initialize mock store state
    useAppStore.setState({
      categories: [
        { 
          id: 'cat-1', 
          user_id: 'test-user-id',
          name: 'Feeding', 
          icon: 'utensils',
          slice: 'Feeding', 
          budget_limit: 1000,
          is_basic: true, 
          is_priority: false,
          is_subscription: false,
          created_at: '2026-06-13T12:00:00Z'
        }
      ],
      expenses: [],
      addExpense: vi.fn(),
      updateExpense: vi.fn(),
    });
  });

  it('stops dragover event propagation and prevents default behavior', () => {
    render(<ExpenseForm open={true} onOpenChange={() => {}} />);
    
    // Find the Drag & Drop area
    const dropZoneText = screen.getByText(/UPLOAD RECEIPT IMAGE/i);
    const dropZone = dropZoneText.parentElement!;

    const dragOverEvent = createEvent.dragOver(dropZone);
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(dragOverEvent, 'stopPropagation');
    
    fireEvent(dropZone, dragOverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('stops drop event propagation, prevents default behavior and parses file', () => {
    render(<ExpenseForm open={true} onOpenChange={() => {}} />);
    
    const dropZoneText = screen.getByText(/UPLOAD RECEIPT IMAGE/i);
    const dropZone = dropZoneText.parentElement!;

    const dropEvent = createEvent.drop(dropZone, {
      dataTransfer: {
        files: [new File(['dummy content'], 'receipt.png', { type: 'image/png' })]
      }
    });
    
    const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(dropEvent, 'stopPropagation');

    fireEvent(dropZone, dropEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('stops change event propagation on file selection', () => {
    render(<ExpenseForm open={true} onOpenChange={() => {}} />);
    
    // Query file input in document.body because Radix UI portal renders Dialog content outside the container
    const fileInput = document.body.querySelector('input[type="file"]')!;

    const changeEvent = createEvent.change(fileInput, {
      target: {
        files: [new File(['dummy content'], 'receipt.png', { type: 'image/png' })]
      }
    });

    const preventDefaultSpy = vi.spyOn(changeEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(changeEvent, 'stopPropagation');

    fireEvent(fileInput, changeEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('stops click propagation on the dropzone container to prevent bubbling to parent layouts', () => {
    render(<ExpenseForm open={true} onOpenChange={() => {}} />);
    
    const dropZoneText = screen.getByText(/UPLOAD RECEIPT IMAGE/i);
    const dropZone = dropZoneText.parentElement!;

    const clickEvent = createEvent.click(dropZone);
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    fireEvent(dropZone, clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
