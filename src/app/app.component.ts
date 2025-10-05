import { Component, HostListener, OnInit } from '@angular/core';
import { InventoryItem, StorageLocation } from './shared/models/inventory-item.interface';

import { CommonModule } from '@angular/common';
import { InventoryListComponent } from './inventory/inventory-list/inventory-list.component';
import { InventoryService } from './core/services/inventory.service';
import { ItemModalComponent } from './inventory/item-modal/item-modal.component';
import { SettingsComponent } from './settings/settings.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, InventoryListComponent, ItemModalComponent, SettingsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
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

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void { }

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
