import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { InventoryItem, AppSettings, StorageLocation } from '../../shared/models/inventory-item.interface';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly ITEMS_KEY = 'fridge_inventory_items';
  private readonly SETTINGS_KEY = 'fridge_app_settings';

  private inventorySubject = new BehaviorSubject<InventoryItem[]>([]);
  public inventory$: Observable<InventoryItem[]> = this.inventorySubject.asObservable();

  private settingsSubject = new BehaviorSubject<AppSettings>({
    reminderDays: 3,
    customCategories: ['肉品', '蔬菜', '醬料', '乳製品']
  });
  public settings$: Observable<AppSettings> = this.settingsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

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

  private saveItems(): void {
    localStorage.setItem(this.ITEMS_KEY, JSON.stringify(this.inventorySubject.value));
  }

  private saveSettings(): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settingsSubject.value));
  }

  // --- CRUD Operations ---

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

  deleteItem(id: string): void {
    const currentItems = this.inventorySubject.value;
    const newItems = currentItems.filter(item => item.id !== id);

    this.inventorySubject.next(newItems);
    this.saveItems();
  }

  // --- Settings Operations ---

  updateReminderDays(days: number): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: AppSettings = {
      ...currentSettings,
      reminderDays: days
    };
    this.settingsSubject.next(newSettings);
    this.saveSettings();
  }

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

  getInventoryByLocation(location: StorageLocation): Observable<InventoryItem[]> {
    return this.inventory$.pipe(
      map(items => items.filter(item => item.storageLocation === location))
    );
  }
}
