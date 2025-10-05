import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { InventoryItem, StorageLocation } from '../../shared/models/inventory-item.interface';
import { map, switchMap, take } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';

type SortKey = 'expiryDate' | 'addedDate';

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit, OnDestroy, OnChanges {
  /** 當前tab */
  @Input() location!: StorageLocation;

  /** 編輯的項目 */
  @Output() editItem = new EventEmitter<InventoryItem>();
  /** 刪除的項目ID */
  @Output() deleteItem = new EventEmitter<string>();

  categories: string[] = [];

  // 批次刪除相關狀態
  batchDeleteMode = false;
  selectedItemIds = new Set<string>();

  // 篩選控制區收合狀態
  isFilterCollapsed = false;

  locationSubject = new BehaviorSubject<StorageLocation>('COLD');
  selectedCategorySubject = new BehaviorSubject<string>('ALL');
  sortKeySubject = new BehaviorSubject<SortKey>('expiryDate');

  public filteredAndSortedItems$!: Observable<(InventoryItem & { isWarning: boolean })[]>;

  private subscription = new Subscription();

  constructor(private inventoryService: InventoryService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && !changes['location'].firstChange) {
      this.locationSubject.next(changes['location'].currentValue);

      // 清除批次刪除狀態，確保每個 tab 的批次刪除狀態獨立
      this.batchDeleteMode = false;
      this.selectedItemIds.clear();
    }
  }

  ngOnInit(): void {
    // 初始化 locationSubject
    this.locationSubject.next(this.location);

    // 初始化收合狀態：從 localStorage 讀取，若無則根據螢幕寬度決定
    const savedState = localStorage.getItem('filterCollapsed');
    if (savedState !== null) {
      this.isFilterCollapsed = savedState === 'true';
    } else {
      // 預設：手機版收合，桌面版展開
      this.isFilterCollapsed = window.innerWidth < 768;
    }

    this.subscription.add(
      this.inventoryService.settings$.subscribe(settings => {
        this.categories = ['ALL', ...settings.customCategories];
      })
    );

    this.filteredAndSortedItems$ = combineLatest([
      this.locationSubject.pipe(
        switchMap(location => this.inventoryService.getInventoryByLocation(location))
      ),
      this.selectedCategorySubject,
      this.sortKeySubject,
      this.inventoryService.settings$.pipe(map(s => s.reminderDays))
    ]).pipe(
      map(([items, category, sortKey, reminderDays]) => {
        let filteredItems = items;
        if (category !== 'ALL') {
          filteredItems = items.filter(item => item.category === category);
        }

        let sortedItems = this.sortItems(filteredItems, sortKey);

        return sortedItems.map(item => ({
          ...item,
          isWarning: this.checkExpiryWarning(item.expiryDate, reminderDays)
        }));
      })
    );
  }

  private sortItems(items: InventoryItem[], key: SortKey): InventoryItem[] {
    return [...items].sort((a, b) => {
      if (key === 'expiryDate') {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      } else if (key === 'addedDate') {
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      }
      return 0;
    });
  }

  private checkExpiryWarning(expiryDateStr: string, reminderDays: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expiryDateStr);
    expiryDate.setHours(0, 0, 0, 0);

    const timeDiff = expiryDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return dayDiff <= reminderDays;
  }

  onCategoryChange(category: string): void {
    this.selectedCategorySubject.next(category);
  }

  onSortChange(key: SortKey): void {
    this.sortKeySubject.next(key);
  }

  onEdit(item: InventoryItem): void {
    this.editItem.emit(item);
  }

  onDelete(itemId: string): void {
    this.deleteItem.emit(itemId);
  }

  // 切換篩選控制區收合狀態
  toggleFilterCollapse(): void {
    this.isFilterCollapsed = !this.isFilterCollapsed;
    // 保存狀態到 localStorage
    localStorage.setItem('filterCollapsed', this.isFilterCollapsed.toString());
  }

  // 批次刪除相關方法
  toggleBatchDeleteMode(): void {
    this.batchDeleteMode = !this.batchDeleteMode;
    // 退出批次模式時清空選擇
    if (!this.batchDeleteMode) {
      this.selectedItemIds.clear();
    }
  }

  toggleItemSelection(itemId: string): void {
    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
    } else {
      this.selectedItemIds.add(itemId);
    }
  }

  // 點擊卡片來勾選/取消勾選
  onCardClick(itemId: string): void {
    this.toggleItemSelection(itemId);
  }

  isItemSelected(itemId: string): boolean {
    return this.selectedItemIds.has(itemId);
  }

  toggleSelectAll(items: (InventoryItem & { isWarning: boolean })[]): void {
    if (this.selectedItemIds.size === items.length) {
      // 全部已選，則取消全選
      this.selectedItemIds.clear();
    } else {
      // 否則全選
      this.selectedItemIds.clear();
      items.forEach(item => this.selectedItemIds.add(item.id));
    }
  }

  onBatchDelete(): void {
    if (this.selectedItemIds.size === 0) {
      return;
    }

    const count = this.selectedItemIds.size;
    const confirmed = window.confirm(`確定要刪除選中的 ${count} 個項目嗎？此操作無法復原。`);

    if (confirmed) {
      const idsToDelete = Array.from(this.selectedItemIds);
      this.inventoryService.deleteMultipleItems(idsToDelete);

      // 刪除後重置狀態
      this.selectedItemIds.clear();
      this.batchDeleteMode = false;
    }
  }

  // 快速批次操作：刪除所有已過期項目
  deleteAllExpiredItems(): void {
    this.filteredAndSortedItems$.pipe(
      take(1),
      map(items => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return items.filter(item => {
          const expiryDate = new Date(item.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          return expiryDate < today;
        });
      })
    ).subscribe(expiredItems => {
      if (expiredItems.length === 0) {
        alert('目前沒有已過期的項目');
        return;
      }

      const confirmed = window.confirm(
        `發現 ${expiredItems.length} 個已過期項目，確定要全部刪除嗎？\n\n` +
        expiredItems.map(item => `• ${item.name} (${item.expiryDate})`).join('\n')
      );

      if (confirmed) {
        const idsToDelete = expiredItems.map(item => item.id);
        this.inventoryService.deleteMultipleItems(idsToDelete);
      }
    });
  }

  // 快速批次操作：刪除當前類別的所有項目
  deleteCurrentCategoryItems(): void {
    const currentCategory = this.selectedCategorySubject.value;

    if (currentCategory === 'ALL') {
      alert('請先選擇特定類別');
      return;
    }

    this.filteredAndSortedItems$.pipe(
      take(1)
    ).subscribe(items => {
      if (items.length === 0) {
        alert(`${currentCategory} 類別目前沒有項目`);
        return;
      }

      const confirmed = window.confirm(
        `確定要刪除「${currentCategory}」類別的所有 ${items.length} 個項目嗎？此操作無法復原。\n\n` +
        items.map(item => `• ${item.name}`).join('\n')
      );

      if (confirmed) {
        const idsToDelete = items.map(item => item.id);
        this.inventoryService.deleteMultipleItems(idsToDelete);
      }
    });
  }

  getLocationIcon(location: StorageLocation): string {
    const icons = {
      'COLD': '❄️',
      'FROZEN': '🧊',
      'AMBIENT': '🌡️'
    };
    return icons[location];
  }

  getLocationLabel(location: StorageLocation): string {
    const labels = {
      'COLD': '冷藏',
      'FROZEN': '冷凍',
      'AMBIENT': '常溫'
    };
    return labels[location];
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
