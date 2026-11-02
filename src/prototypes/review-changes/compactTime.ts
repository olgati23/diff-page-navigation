export function compactTime(value: string): string {
  return value.replace(/\b(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\b/gi,
    (_, amount: string, unit: string) => `${amount}${({ second: 's', minute: 'm', hour: 'h', day: 'd', week: 'w', month: 'mo', year: 'y' } as Record<string, string>)[unit.toLowerCase().replace(/s$/, '')]}`)
}
