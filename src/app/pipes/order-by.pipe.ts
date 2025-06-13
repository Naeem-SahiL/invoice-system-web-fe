import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'orderBy',
    standalone: true
})
export class OrderByPipe implements PipeTransform {
    transform<T>(array: T[], property: string, direction: 'asc' | 'desc' = 'asc'): T[] {
        if (!Array.isArray(array) || !property) return array;
        return [...array].sort((a, b) => {
            const aValue = a[property];
            const bValue = b[property];
            if (aValue == null) return 1;
            if (bValue == null) return -1;
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
}
