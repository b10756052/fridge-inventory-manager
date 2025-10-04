import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../core/services/inventory.service';
import { AppSettings } from '../shared/models/inventory-item.interface';

@Component({
    selector: 'app-settings',
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    settings: AppSettings = {
        reminderDays: 3,
        customCategories: []
    };

    newCategory: string = '';
    isExpanded: boolean = false;

    constructor(private inventoryService: InventoryService) { }

    ngOnInit(): void {
        this.inventoryService.settings$.subscribe(settings => {
            this.settings = settings;
        });
    }

    toggleSettings(): void {
        this.isExpanded = !this.isExpanded;
    }

    onReminderDaysChange(): void {
        if (this.settings.reminderDays >= 0) {
            this.inventoryService.updateReminderDays(this.settings.reminderDays);
        }
    }

    addCategory(): void {
        if (this.newCategory.trim()) {
            this.inventoryService.addCustomCategory(this.newCategory.trim());
            this.newCategory = '';
        }
    }
}
