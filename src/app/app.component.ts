import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { InventoryItem, StorageLocation } from './shared/models/inventory-item.interface';

import { CommonModule } from '@angular/common';
import { InventoryListComponent } from './inventory/inventory-list/inventory-list.component';
import { InventoryService } from './core/services/inventory.service';
import { ItemModalComponent } from './inventory/item-modal/item-modal.component';
import { SettingsComponent } from './settings/settings.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, InventoryListComponent, ItemModalComponent, SettingsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  /** app title */
  appName = '冰箱管家!';

  /** 類別tabs */
  storageLocations: { label: string; value: StorageLocation }[] = [
    { label: '冷藏', value: 'COLD' },
    { label: '冷凍', value: 'FROZEN' },
    { label: '常溫', value: 'AMBIENT' }
  ];
  /** 當前選擇的tab */
  currentTab: StorageLocation = this.storageLocations[0].value;

  /** 是否開啟物品填寫開窗 */
  isModalOpen: boolean = false;
  /** 是否正在編輯物品 (null 表示新增) */
  itemToEdit: InventoryItem | null = null;
  /** 是否開啟設定頁面 */
  isSettingsOpen: boolean = false;
  /** 是否顯示回到頂部按鈕 */
  showScrollToTop: boolean = false;

  /** PWA 安裝相關 */
  showInstallPrompt: boolean = false;
  private deferredPrompt: any = null;
  private readonly INSTALL_PROMPT_DISMISSED_KEY = 'pwa-install-prompt-dismissed';

  /** 訂閱管理 */
  private settingsSubscription?: Subscription;

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.setupPWAInstallPrompt();
    this.setupFontSizeListener();
  }

  ngOnDestroy(): void {
    // 清理訂閱
    this.settingsSubscription?.unsubscribe();
  }

  // #region --- 字體大小設定 ---

  /** 監聽字體大小設定變更 */
  private setupFontSizeListener(): void {
    this.settingsSubscription = this.inventoryService.settings$.subscribe(settings => {
      this.applyFontSize(settings.fontSize || 'system');
    });
  }

  /** 套用字體大小設定 */
  private applyFontSize(fontSize: string): void {
    const htmlElement = document.documentElement;

    // 移除所有字體大小相關的 class
    htmlElement.classList.remove('font-small', 'font-large', 'font-xlarge');

    // 根據設定套用對應的 class
    switch (fontSize) {
      case 'small':
        htmlElement.classList.add('font-small');
        break;
      case 'large':
        htmlElement.classList.add('font-large');
        break;
      case 'xlarge':
        htmlElement.classList.add('font-xlarge');
        break;
      case 'medium':
        // 不加任何 class,使用預設大小
        break;
      case 'system':
      default:
        // 不加任何 class,讓瀏覽器使用系統設定
        break;
    }
  }

  // #endregion

  // #region --- PWA 安裝提示 ---

  /** 設定 PWA 安裝提示 */
  private setupPWAInstallPrompt(): void {
    // 檢查用戶是否已經關閉過提醒
    const isDismissed = localStorage.getItem(this.INSTALL_PROMPT_DISMISSED_KEY);
    if (isDismissed) {
      return;
    }

    // 監聽 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', (e: any) => {
      // 防止默認的安裝提示
      e.preventDefault();
      // 保存事件以便稍後使用
      this.deferredPrompt = e;
      // 顯示自定義安裝提示
      this.showInstallPrompt = true;
    });
  }

  /** 執行 PWA 安裝 */
  installPWA(): void {
    if (!this.deferredPrompt) {
      return;
    }

    // 顯示安裝提示
    this.deferredPrompt.prompt();

    // 等待用戶回應
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('用戶接受安裝 PWA');
      } else {
        console.log('用戶拒絕安裝 PWA');
      }
      // 清除提示
      this.deferredPrompt = null;
      this.showInstallPrompt = false;
    });
  }

  /** 關閉 PWA 安裝提示 */
  dismissInstallPrompt(): void {
    this.showInstallPrompt = false;
    // 記錄用戶已關閉提醒，下次不再顯示
    localStorage.setItem(this.INSTALL_PROMPT_DISMISSED_KEY, 'true');
  }

  // #endregion

  // #region --- Modal 互動方法 ---

  /** 開啟新增物品視窗 */
  openModalForNewItem(): void {
    this.itemToEdit = null;
    this.isModalOpen = true;
  }

  /** 編輯物品 */
  onEditItem(item: InventoryItem): void {
    this.itemToEdit = item;
    this.isModalOpen = true;
  }

  /** 關閉物品視窗 */
  closeModal(): void {
    this.isModalOpen = false;
    this.itemToEdit = null;
  }

  /** 開啟設定頁面 */
  openSettings(): void {
    this.isSettingsOpen = true;
  }

  /** 關閉設定頁面 */
  closeSettings(): void {
    this.isSettingsOpen = false;
  }

  // #endregion

  /** 刪除物品 */
  onDeleteItem(itemId: string): void {
    if (confirm('確定要刪除嗎?')) {
      this.inventoryService.deleteItem(itemId);
    }
  }

  /** 取得類別icon */
  getLocationIcon(location: StorageLocation): string {
    const icons = {
      'COLD': '❄️',
      'FROZEN': '🧊',
      'AMBIENT': '🌡️'
    };
    return icons[location];
  }

  // #region --- 回到頂部功能 ---

  /** 監聽滾動事件，控制回到頂部按鈕的顯示 */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // 當滾動超過 300px 時顯示按鈕
    this.showScrollToTop = window.pageYOffset > 300;
  }

  /** 平滑滾動回到頂部 */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // #endregion
}
