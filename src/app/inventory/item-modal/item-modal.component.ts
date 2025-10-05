import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryItem, StorageLocation } from '../../shared/models/inventory-item.interface';

import { CommonModule } from '@angular/common';
import { InventoryService } from '../../core/services/inventory.service';

@Component({
  selector: 'app-item-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-modal.component.html',
  styleUrls: ['./item-modal.component.scss']
})
export class ItemModalComponent implements OnInit {
  @Input() itemToEdit: InventoryItem | null = null;
  @Input() currentLocation: StorageLocation = 'COLD';
  @Output() close = new EventEmitter<void>();

  itemForm!: FormGroup;
  storageLocations: StorageLocation[] = ['COLD', 'FROZEN', 'AMBIENT'];
  categories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.inventoryService.settings$.subscribe(settings => {
      this.categories = settings.customCategories;
    });

    this.itemForm = this.fb.group({
      name: [this.itemToEdit?.name || '', [Validators.required]],
      expiryDate: [this.itemToEdit?.expiryDate || '', [Validators.required]],
      quantity: [this.itemToEdit?.quantity || 1, [Validators.required, Validators.min(0.01)]],
      unit: [this.itemToEdit?.unit || '', [Validators.required]],
      category: [this.itemToEdit?.category || this.categories[0] || '', [Validators.required]],
      storageLocation: [this.itemToEdit?.storageLocation || this.currentLocation, [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      const formValue = this.itemForm.value;

      if (this.itemToEdit) {
        // 編輯現有物品
        const updatedItem: InventoryItem = {
          ...this.itemToEdit,
          ...formValue
        };
        this.inventoryService.updateItem(updatedItem);
      } else {
        // 新增物品
        this.inventoryService.addItem(formValue);
      }

      this.closeModal();
    }
  }

  closeModal(): void {
    this.close.emit();
  }
}
