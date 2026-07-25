import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/renderer/App';

describe('App', () => {
  beforeEach(() => {
    window.desktop = {
      getRuntimeInfo: vi.fn().mockResolvedValue({
        electron: '43.2.0',
        chrome: '150',
        node: '24.18.0',
        platform: 'win32',
      }),
      reportReady: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('通过 preload bridge 读取运行时信息', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '检查运行时' }));
    expect(await screen.findByText('43.2.0')).toBeInTheDocument();
    expect(window.desktop.getRuntimeInfo).toHaveBeenCalledOnce();
  });
});
