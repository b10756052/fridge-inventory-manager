import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, StorageLocation } from '../../shared/models/inventory-item.interface';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

type SortKey = 'expiryDate' | 'addedDate';

@Component({
  selector: 'app-inventory-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit, OnDestroy {
  @Input() location!: StorageLocation;

  @Output() editItem = new EventEmitter<InventoryItem>();
  @Output() deleteItem = new EventEmitter<string>();

  categories: string[] = [];

  selectedCategorySubject = new BehaviorSubject<string>('ALL');
  sortKeySubject = new BehaviorSubject<SortKey>('expiryDate');

  public filteredAndSortedItems$!: Observable<(InventoryItem & { isWarning: boolean })[]>;

  private subscription = new Subscription();

  constructor(private inventoryService: InventoryService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.inventoryService.settings$.subscribe(settings => {
        this.categories = ['ALL', ...settings.customCategories];
      })
    );

    this.filteredAndSortedItems$ = combineLatest([
      this.inventoryService.getInventoryByLocation(this.location),
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
    return items.sort((a, b) => {
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
