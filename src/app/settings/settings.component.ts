import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { AppSettings, FontSize } from '../shared/models/inventory-item.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../core/services/inventory.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  /** 關閉設定頁面事件 */
  @Output() close = new EventEmitter<void>();

  /** 設定項目 */
  settings: AppSettings = {
    reminderDays: 3,
    customCategories: [],
    fontSize: 'system'
  };

  /** 新增類別輸入框雙向綁定 */
  newCategory: string = '';

  /** 字體大小選項 */
  fontSizeOptions: { value: FontSize; label: string; description: string }[] = [
    { value: 'system', label: '跟隨系統', description: '自動依照手機設定調整' },
    { value: 'small', label: '小', description: '適合眼睛好的使用者' },
    { value: 'medium', label: '標準', description: '預設字體大小' },
    { value: 'large', label: '大', description: '適合老花眼使用者' },
    { value: 'xlarge', label: '特大', description: '超大字體,更易閱讀' }
  ];

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    // 訂閱設定變更
    this.inventoryService.settings$.subscribe(settings => {
      this.settings = settings;
    });
  }

  /** 關閉設定頁面 */
  closeModal(): void {
    this.close.emit();
  }

  /** 提醒天數變更 */
  onReminderDaysChange(): void {
    if (!this.settings.reminderDays || this.settings.reminderDays < 1) {
      this.settings.reminderDays = 1;
    }
    this.inventoryService.updateReminderDays(this.settings.reminderDays);
  }

  /** 新增類別 */
  addCategory(): void {
    if (this.newCategory.trim()) {
      this.inventoryService.addCustomCategory(this.newCategory.trim());
      this.newCategory = '';
    }
  }

  /** 刪除類別 */
  deleteCategory(category: string): void {
    if (confirm(`確定要刪除類別「${category}」嗎？`)) {
      this.inventoryService.deleteCustomCategory(category);
    }
  }

  /** 檢查類別是否能被刪除 (有物品的類別不能刪除 & 剩一筆類別時不能刪除) */
  canDeleteCategory(category: string): boolean {
    return !this.inventoryService.hasCategoryInventory(category) && this.settings.customCategories.length > 1;
  }

  /** 字體大小變更 */
  onFontSizeChange(): void {
    if (this.settings.fontSize) {
      this.inventoryService.updateFontSize(this.settings.fontSize);
    }
  }
}
