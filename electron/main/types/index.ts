
import { BrowserWindow } from 'electron';

export interface MainBrowserWin extends BrowserWindow{
  childProcessArray?: any[]
}

