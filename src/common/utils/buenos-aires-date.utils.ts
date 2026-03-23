import { DateTime } from 'luxon';

/**
 * Utilidad centralizada para manejar fechas en Buenos Aires, Argentina
 * TODAS las fechas del sistema deben usar esta zona horaria
 */
export class BuenosAiresDateUtils {
  private static readonly TIMEZONE = 'America/Argentina/Buenos_Aires';

  /**
   * Obtiene la fecha y hora actual en Buenos Aires
   */
  static now(): Date {
    return DateTime.now().setZone(this.TIMEZONE).toJSDate();
  }

  /**
   * Obtiene la fecha y hora actual en Buenos Aires como string ISO
   */
  static nowISO(): string {
    return DateTime.now().setZone(this.TIMEZONE).toISO();
  }

  /**
   * Convierte cualquier fecha a la zona horaria de Buenos Aires
   */
  static toBuenosAires(date: Date | string): Date {
    return DateTime.fromJSDate(new Date(date)).setZone(this.TIMEZONE).toJSDate();
  }

  /**
   * Formatea una fecha en Buenos Aires para mostrar al usuario
   */
  static format(date: Date | string, format: string = 'dd/MM/yyyy HH:mm:ss'): string {
    return DateTime.fromJSDate(new Date(date))
      .setZone(this.TIMEZONE)
      .toFormat(format);
  }

  /**
   * Obtiene la zona horaria configurada
   */
  static getTimezone(): string {
    return this.TIMEZONE;
  }
}