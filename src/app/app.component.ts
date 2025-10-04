import { Component, OnInit } from '@angular/core';
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
  appName = '冰箱管家!';

  storageLocations: { label: string; value: StorageLocation }[] = [
    { label: '冷藏 (COLD)', value: 'COLD' },
    { label: '冷凍 (FROZEN)', value: 'FROZEN' },
    { label: '常溫 (AMBIENT)', value: 'AMBIENT' }
  ];
  currentTab: StorageLocation = this.storageLocations[0].value;

  // Modal 狀態控制
  isModalOpen: boolean = false;
  itemToEdit: InventoryItem | null = null;

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void { }

  // --- Modal 交互方法 ---

  openModalForNewItem(): void {
    this.itemToEdit = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.itemToEdit = null;
  }

  onEditItem(item: InventoryItem): void {
    this.itemToEdit = item;
    this.isModalOpen = true;
  }

  onDeleteItem(itemId: string): void {
    if (confirm('確定要刪除此物品嗎?此操作無法撤銷。')) {
      this.inventoryService.deleteItem(itemId);
    }
  }
}
