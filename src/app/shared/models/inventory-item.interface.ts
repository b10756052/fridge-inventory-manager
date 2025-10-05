export type StorageLocation = 'COLD' | 'FROZEN' | 'AMBIENT';

/**
 * 冰箱庫存物品的資料模型
 */
export interface InventoryItem {
  id: string; // 唯一的識別碼
  name: string; // 物品名稱
  expiryDate: string; // 過期日期 (YYYY-MM-DD 格式)
  quantity: number; // 數量
  unit: string; // 單位 (e.g., 公克, 包, 瓶)
  category: string; // 類別
  storageLocation: StorageLocation; // 存放區
  addedDate: string; // 新增日期 (YYYY-MM-DD 格式)
}

/**
 * 字體大小選項
 */
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * 應用程式的全域設定模型
 */
export interface AppSettings {
  reminderDays: number; // 過期前 N 天提醒
  customCategories: string[]; // 使用者自定義的類別清單
  fontSize?: FontSize; // 字體大小設定 (預設: 'medium')
}
