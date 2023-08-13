
import { BrowserWindow } from 'electron';
import { VideoWin } from '../win/VideoWin';

export interface MainBrowserWin extends BrowserWindow{
  childProcessArray?: any[]
  isExit?: boolean
  videoWinList?: Array<VideoWin>
}

