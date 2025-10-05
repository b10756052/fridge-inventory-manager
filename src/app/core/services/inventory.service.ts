import { AppSettings, InventoryItem, StorageLocation } from '../../shared/models/inventory-item.interface';
import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  /** 物品用於 localStorage 的 key */
  private readonly ITEMS_KEY = 'fridge_inventory_items';
  /** 設定用於 localStorage 的 key */
  private readonly SETTINGS_KEY = 'fridge_app_settings';

  /** 清單 subject */
  private inventorySubject = new BehaviorSubject<InventoryItem[]>([]);
  /** 設定 subject */
  private settingsSubject = new BehaviorSubject<AppSettings>({
    reminderDays: 3,
    customCategories: ['肉品', '蔬菜', '醬料', '乳製品']
  });

  /** 清單 subject 訂閱 */
  public inventory$: Observable<InventoryItem[]> = this.inventorySubject.asObservable();
  /** 設定 subject 訂閱 */
  public settings$: Observable<AppSettings> = this.settingsSubject.asObservable();


  constructor() {
    this.loadInitialData();
  }

  /** 從 localStorage 載入初始資料 */
  private loadInitialData(): void {
    const itemsJson = localStorage.getItem(this.ITEMS_KEY);
    if (itemsJson) {
      const items: InventoryItem[] = JSON.parse(itemsJson);
      this.inventorySubject.next(items);
    }

    const settingsJson = localStorage.getItem(this.SETTINGS_KEY);
    if (settingsJson) {
      const savedSettings: AppSettings = JSON.parse(settingsJson);
      this.settingsSubject.next({ ...this.settingsSubject.value, ...savedSettings });
    }
  }

  /** 將目前清單儲存到 localStorage */
  private saveItems(): void {
    localStorage.setItem(this.ITEMS_KEY, JSON.stringify(this.inventorySubject.value));
  }

  /** 將目前設定儲存到 localStorage */
  private saveSettings(): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settingsSubject.value));
  }

  // #region --- 物品CRUD ---

  /** 新增物品 */
  addItem(item: Omit<InventoryItem, 'id' | 'addedDate'>): void {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      addedDate: new Date().toISOString().split('T')[0]
    };

    const currentItems = [...this.inventorySubject.value, newItem];
    this.inventorySubject.next(currentItems);
    this.saveItems();
  }

  /** 更新物品 */
  updateItem(updatedItem: InventoryItem): void {
    const currentItems = this.inventorySubject.value;
    const index = currentItems.findIndex(item => item.id === updatedItem.id);

    if (index > -1) {
      const newItems = [...currentItems];
      newItems[index] = updatedItem;
      this.inventorySubject.next(newItems);
      this.saveItems();
    }
  }

  /** 刪除物品 */
  deleteItem(id: string): void {
    const currentItems = this.inventorySubject.value;
    const newItems = currentItems.filter(item => item.id !== id);

    this.inventorySubject.next(newItems);
    this.saveItems();
  }

  /** 批次刪除多個物品 */
  deleteMultipleItems(ids: string[]): void {
    const currentItems = this.inventorySubject.value;
    const idsSet = new Set(ids);
    const newItems = currentItems.filter(item => !idsSet.has(item.id));

    this.inventorySubject.next(newItems);
    this.saveItems();
  }

  // #endregion

  // ##region --- 設定操作 ---

  /** 更新提醒天數 */
  updateReminderDays(days: number): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: AppSettings = {
      ...currentSettings,
      reminderDays: days
    };
    this.settingsSubject.next(newSettings);
    this.saveSettings();
  }

  /** 新增自訂類別 */
  addCustomCategory(category: string): void {
    const currentSettings = this.settingsSubject.value;
    const normalizedCategory = category.trim();

    if (normalizedCategory && !currentSettings.customCategories.includes(normalizedCategory)) {
      const newSettings: AppSettings = {
        ...currentSettings,
        customCategories: [...currentSettings.customCategories, normalizedCategory]
      };
      this.settingsSubject.next(newSettings);
      this.saveSettings();
    }
  }

  /** 刪除自訂類別 */
  deleteCustomCategory(category: string): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: AppSettings = {
      ...currentSettings,
      customCategories: currentSettings.customCategories.filter(cat => cat !== category)
    };
    this.settingsSubject.next(newSettings);
    this.saveSettings();
  }

  /** 檢查是否有物品使用該類別 */
  hasCategoryInventory(category: string): boolean {
    const currentItems = this.inventorySubject.value;
    return currentItems.some(item => item.category === category);
  }

  // #endregion

  /** 根據儲存位置取得物品 */
  getInventoryByLocation(location: StorageLocation): Observable<InventoryItem[]> {
    return this.inventory$.pipe(
      map(items => items.filter(item => item.storageLocation === location))
    );
  }
}
