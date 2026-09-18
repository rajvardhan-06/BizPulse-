import { Receipt, Budget, isConfirmedReceipt } from '../store';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface BudgetAnalysis {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'On Track' | 'Near Limit' | 'Over Budget' | 'No Data';
}

export function calculateBudgetSpending(budgets: Budget[], receipts: Receipt[]): BudgetAnalysis[] {
  const confirmedReceipts = receipts.filter(isConfirmedReceipt);

  return budgets.map(budget => {
    let spent = 0;
    
    // Safety check for dates
    const startDate = startOfDay(parseISO(budget.startDate));
    const endDate = endOfDay(parseISO(budget.endDate));
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
       return {
         budget,
         spent: 0,
         remaining: budget.amount,
         percentage: 0,
         status: 'No Data'
       };
    }

    const relevantReceipts = confirmedReceipts.filter(r => {
      let receiptDate: Date;
      if (r.date) {
        receiptDate = parseISO(r.date);
      } else if (r.captureTimestamp) {
        receiptDate = new Date(r.captureTimestamp);
      } else {
        return false;
      }
      return !isNaN(receiptDate.getTime()) && isWithinInterval(receiptDate, { start: startDate, end: endDate });
    });

    for (const receipt of relevantReceipts) {
      if (budget.category) {
        // Category specific budget
        for (const item of receipt.items) {
          if (item.category === budget.category) {
            spent += (item.qty * item.unit_price);
          }
        }
      } else {
        // Overall budget - fallback to item sum if total is invalid
        if (receipt.total != null && receipt.total > 0) {
           spent += receipt.total;
        } else {
           spent += receipt.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
        }
      }
    }

    // Fix floating point issues
    spent = Math.round(spent * 100) / 100;
    const remaining = Math.round((budget.amount - spent) * 100) / 100;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    let status: BudgetAnalysis['status'] = 'On Track';
    if (percentage >= 100) {
      status = 'Over Budget';
    } else if (budget.alertThreshold && percentage >= budget.alertThreshold) {
      status = 'Near Limit';
    } else if (spent === 0 && relevantReceipts.length === 0) {
      status = 'No Data';
    }

    return {
      budget,
      spent,
      remaining,
      percentage: Math.min(percentage, 1000), // Cap for display
      status
    };
  });
}
