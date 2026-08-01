import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kLocaleStorageKey = '__locale_key__';

class FFLocalizations {
  FFLocalizations(this.locale);

  final Locale locale;

  static FFLocalizations of(BuildContext context) =>
      Localizations.of<FFLocalizations>(context, FFLocalizations)!;

  static List<String> languages() => ['es', 'en'];

  static late SharedPreferences _prefs;
  static Future initialize() async =>
      _prefs = await SharedPreferences.getInstance();
  static Future storeLocale(String locale) =>
      _prefs.setString(_kLocaleStorageKey, locale);
  static Locale? getStoredLocale() {
    final locale = _prefs.getString(_kLocaleStorageKey);
    return locale != null && locale.isNotEmpty ? createLocale(locale) : null;
  }

  String get languageCode => locale.toString();
  String? get languageShortCode =>
      _languagesWithShortCode.contains(locale.toString())
          ? '${locale.toString()}_short'
          : null;
  int get languageIndex => languages().contains(languageCode)
      ? languages().indexOf(languageCode)
      : 0;

  String getText(String key) =>
      (kTranslationsMap[key] ?? {})[locale.toString()] ?? '';

  String getVariableText({
    String? esText = '',
    String? enText = '',
  }) =>
      [esText, enText][languageIndex] ?? '';

  static const Set<String> _languagesWithShortCode = {
    'ar',
    'az',
    'ca',
    'cs',
    'da',
    'de',
    'dv',
    'en',
    'es',
    'et',
    'fi',
    'fr',
    'gr',
    'he',
    'hi',
    'hu',
    'it',
    'km',
    'ku',
    'mn',
    'ms',
    'no',
    'pt',
    'ro',
    'ru',
    'rw',
    'sv',
    'th',
    'uk',
    'vi',
  };
}

/// Used if the locale is not supported by GlobalMaterialLocalizations.
class FallbackMaterialLocalizationDelegate
    extends LocalizationsDelegate<MaterialLocalizations> {
  const FallbackMaterialLocalizationDelegate();

  @override
  bool isSupported(Locale locale) => _isSupportedLocale(locale);

  @override
  Future<MaterialLocalizations> load(Locale locale) async =>
      SynchronousFuture<MaterialLocalizations>(
        const DefaultMaterialLocalizations(),
      );

  @override
  bool shouldReload(FallbackMaterialLocalizationDelegate old) => false;
}

/// Used if the locale is not supported by GlobalCupertinoLocalizations.
class FallbackCupertinoLocalizationDelegate
    extends LocalizationsDelegate<CupertinoLocalizations> {
  const FallbackCupertinoLocalizationDelegate();

  @override
  bool isSupported(Locale locale) => _isSupportedLocale(locale);

  @override
  Future<CupertinoLocalizations> load(Locale locale) =>
      SynchronousFuture<CupertinoLocalizations>(
        const DefaultCupertinoLocalizations(),
      );

  @override
  bool shouldReload(FallbackCupertinoLocalizationDelegate old) => false;
}

class FFLocalizationsDelegate extends LocalizationsDelegate<FFLocalizations> {
  const FFLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => _isSupportedLocale(locale);

  @override
  Future<FFLocalizations> load(Locale locale) =>
      SynchronousFuture<FFLocalizations>(FFLocalizations(locale));

  @override
  bool shouldReload(FFLocalizationsDelegate old) => false;
}

Locale createLocale(String language) => language.contains('_')
    ? Locale.fromSubtags(
        languageCode: language.split('_').first,
        scriptCode: language.split('_').last,
      )
    : Locale(language);

bool _isSupportedLocale(Locale locale) {
  final language = locale.toString();
  return FFLocalizations.languages().contains(
    language.endsWith('_')
        ? language.substring(0, language.length - 1)
        : language,
  );
}

final kTranslationsMap = <Map<String, Map<String, String>>>[
  // Loginscreen
  {
    'vuq8ikq3': {
      'es': 'Welcome Back',
      'en': '',
    },
    'mvgdokse': {
      'es': 'Fill out the information below in order to access your account.',
      'en': '',
    },
    'xg5n7719': {
      'es': 'Email',
      'en': '',
    },
    '2v22au6q': {
      'es': 'Email',
      'en': '',
    },
    '9jgg098i': {
      'es': 'Password',
      'en': '',
    },
    'n25li23t': {
      'es': 'Password',
      'en': '',
    },
    'lr983yk1': {
      'es': 'Sign In',
      'en': '',
    },
    'doj07107': {
      'es': 'Or sign in with',
      'en': '',
    },
    'ingvnq79': {
      'es': 'Continue with Google',
      'en': '',
    },
    'ilo15d0d': {
      'es': 'Don\'t have an account?  ',
      'en': '',
    },
    'tjg7y8nh': {
      'es': 'Sign Up here',
      'en': '',
    },
    'ab2blf1n': {
      'es': 'Home',
      'en': '',
    },
  },
  // E360AdminPanel
  {
    'q9g5whig': {
      'es': 'E360 Admin Panel',
      'en': '',
    },
    '6gad88uj': {
      'es': 'Command Center',
      'en': '',
    },
    'gwbp4ijs': {
      'es': 'Platform Navigation',
      'en': '',
    },
    'v2pc2c8h': {
      'es': 'Dashboard',
      'en': '',
    },
    'c6o3c8ob': {
      'es': 'Gestión de Usuarios',
      'en': '',
    },
    'jeo7qpaz': {
      'es': 'Departamentos',
      'en': '',
    },
    'yxvln68x': {
      'es': 'Crédito',
      'en': '',
    },
    'yv5zxlw1': {
      'es': 'Préstamos',
      'en': '',
    },
    'g9yq9zh4': {
      'es': 'Ventas',
      'en': '',
    },
    'sxdzku1g': {
      'es': 'Marketing',
      'en': '',
    },
    '8byk6cko': {
      'es': 'Ajustes del Sistema',
      'en': '',
    },
    '0nl3ouhk': {
      'es': 'Cerrar Sesión',
      'en': '',
    },
    'q9h7rx02': {
      'es': 'Light Mode',
      'en': '',
    },
    '5k1aiaer': {
      'es': 'Dark Mode',
      'en': '',
    },
    'gtvcg5jj': {
      'es': 'Yampiero de Dios',
      'en': '',
    },
    'pus19rab': {
      'es': 'jp@startpoint.biz',
      'en': '',
    },
    's9lv4ttn': {
      'es': 'v0.1',
      'en': '',
    },
    'h4azpw2v': {
      'es': 'Hola, Fernando 👋',
      'en': '',
    },
    '50jx6jsx': {
      'es': 'CTO · E360 Platform',
      'en': '',
    },
    '475a6vkh': {
      'es': 'Martes, 14 de Abril, 2026',
      'en': '',
    },
    'q4ht1mrw': {
      'es': 'Sistema activo',
      'en': '',
    },
    'vzb0bsr4': {
      'es': 'v2.4.1',
      'en': '',
    },
    '5r4oqbry': {
      'es': 'RESUMEN DEL DÍA',
      'en': '',
    },
    'cd1d54vr': {
      'es': '1,284',
      'en': '',
    },
    'mg5qo9by': {
      'es': 'Brokers \nRegistrados',
      'en': '',
    },
    '2cawmw9x': {
      'es': '98.7%',
      'en': '',
    },
    'q3evmyqq': {
      'es': 'Nuevos Leads\nde Crédito',
      'en': '',
    },
    'nf9r5wdm': {
      'es': '47',
      'en': '',
    },
    'p9xos96m': {
      'es': 'Alertas \npendientes',
      'en': '',
    },
    'qzi21yzw': {
      'es': 'Informe Administrativo',
      'en': '',
    },
    'fyf1tdri': {
      'es': '\$12.4K',
      'en': '',
    },
    'z3y2npgo': {
      'es': 'Pagos Exitosos',
      'en': '',
    },
    'xhbc73zz': {
      'es': '+5.2% 📈',
      'en': '',
    },
    'ykjt6erl': {
      'es': '98',
      'en': '',
    },
    'fi5xsx3b': {
      'es': 'Casos CRC\nen Proceso',
      'en': '',
    },
    '7dc6mbnr': {
      'es': '12 pdt actual',
      'en': '',
    },
    'me5avcfm': {
      'es': '22',
      'en': '',
    },
    '6tal0pqv': {
      'es': 'Prestamos\nen revisión',
      'en': '',
    },
    '6su1z9t0': {
      'es': '3 Urgentes ⚠️',
      'en': '',
    },
    'm5g0z4cn': {
      'es': 'Pago Fallido',
      'en': '',
    },
    'jjpddckr': {
      'es': 'César M.',
      'en': '',
    },
    '87265kb0': {
      'es': '\$250',
      'en': '',
    },
    '3joyxffl': {
      'es': 'Caso CRC',
      'en': '',
    },
    'kpm24050': {
      'es': 'Fernando Elvir',
      'en': '',
    },
    '6eyfexyz': {
      'es': 'Documentos Faltantes',
      'en': '',
    },
    '37w4pt8y': {
      'es': 'Anthony: Ponce Bank Statement',
      'en': '',
    },
    'q4xekvkr': {
      'es': 'Avisar a Anthony',
      'en': '',
    },
    '7g7wbn3d': {
      'es': 'Configuración',
      'en': '',
    },
    'pfnlk971': {
      'es': 'Ajustes del sistema',
      'en': '',
    },
    'vmekvme9': {
      'es': 'Actividad Reciente',
      'en': '',
    },
    'd7v5fd4q': {
      'es': 'Nuevo usuario registrado',
      'en': '',
    },
    'fzv85cyl': {
      'es': 'maria.lopez@e360.com · hace 5 min',
      'en': '',
    },
    '6bvypt4t': {
      'es': 'Alerta de rendimiento',
      'en': '',
    },
    'w2heo1cc': {
      'es': 'Servidor EU-West · hace 18 min',
      'en': '',
    },
    'mkj70mfs': {
      'es': 'Backup completado',
      'en': '',
    },
    'yf4naxj2': {
      'es': 'Base de datos principal · hace 1 h',
      'en': '',
    },
  },
  // E360Members
  {
    'xgbbilbm': {
      'es': 'check.io',
      'en': '',
    },
    'uy89g2yc': {
      'es': 'Platform Navigation',
      'en': '',
    },
    'sswhkzf7': {
      'es': 'Dashboard',
      'en': '',
    },
    'kx0fdqim': {
      'es': 'Chats',
      'en': '',
    },
    'b9pv9ta9': {
      'es': 'Projects',
      'en': '',
    },
    '21pwdx77': {
      'es': 'Settings',
      'en': '',
    },
    'k28hfmdo': {
      'es': 'Notifications',
      'en': '',
    },
    'vcnfkzc5': {
      'es': '12',
      'en': '',
    },
    '9p28gb5x': {
      'es': 'Billing',
      'en': '',
    },
    'g47r11qq': {
      'es': 'Explore',
      'en': '',
    },
    's64l2wmv': {
      'es': 'Light Mode',
      'en': '',
    },
    '6vswfvcx': {
      'es': 'Dark Mode',
      'en': '',
    },
    '6dlg8rr5': {
      'es': 'Andrew D.',
      'en': '',
    },
    'krk15gd3': {
      'es': 'admin@gmail.com',
      'en': '',
    },
    '5dyvdwcg': {
      'es': 'Gestión de Usuarios',
      'en': '',
    },
    '34q0y01c': {
      'es': 'Listado de brokers activos y pendientes en activar.',
      'en': '',
    },
    '1fpb5sbl': {
      'es': 'Search all users...',
      'en': '',
    },
    'q6wqozj6': {
      'es': 'Busca por nombre o email...',
      'en': '',
    },
    'y52y3y41': {
      'es': 'Todos',
      'en': '',
    },
    'ecu9qzod': {
      'es': 'Activos',
      'en': '',
    },
    'bm6bw2r5': {
      'es': 'Pendientes',
      'en': '',
    },
    '1szdv8kh': {
      'es': 'Suspendidos',
      'en': '',
    },
    '8u94wbp9': {
      'es': 'Todos',
      'en': '',
    },
    'mwcm2ujs': {
      'es': 'All',
      'en': '',
    },
    '833tv566': {
      'es': 'Name',
      'en': '',
    },
    'm87ajz8o': {
      'es': 'Last Active',
      'en': '',
    },
    'w3zpswe3': {
      'es': 'Title',
      'en': '',
    },
    '0wtj7taf': {
      'es': 'Status',
      'en': '',
    },
    'lmuvf6ap': {
      'es': 'César M. (Híbrido)',
      'en': '',
    },
    'rxr558nw': {
      'es': '(Aprobación pendiente)',
      'en': '',
    },
    '82smwwf7': {
      'es': 'Email:',
      'en': '',
    },
    '9wr1g4a2': {
      'es': 'cesar@test.com',
      'en': '',
    },
    'wrsd9n3f': {
      'es': 'Status:',
      'en': '',
    },
    '3tobuivi': {
      'es': 'Pendiente',
      'en': '',
    },
    '6i86sz1v': {
      'es': 'Rechazar',
      'en': '',
    },
    'qh5n27qf': {
      'es': 'Aprobar',
      'en': '',
    },
    'ypuei058': {
      'es': '5 mins ago',
      'en': '',
    },
    '2ef48q1m': {
      'es': 'Head of Design',
      'en': '',
    },
    'lp67216o': {
      'es': '5 mins ago',
      'en': '',
    },
    'zokxszrl': {
      'es': 'Head of Design',
      'en': '',
    },
    'sdwntc76': {
      'es': 'Sam C. (Híbrido)',
      'en': '',
    },
    '5fq0e3x8': {
      'es': 'Email:',
      'en': '',
    },
    'ueryy67k': {
      'es': 'sam@test.com',
      'en': '',
    },
    'gj5gt505': {
      'es': 'Status:',
      'en': '',
    },
    'bzkf5bua': {
      'es': 'Activo',
      'en': '',
    },
    'wrskvuqy': {
      'es': 'Suspender',
      'en': '',
    },
    'iuk63bpj': {
      'es': 'Solicitar pago',
      'en': '',
    },
    'ei11ke5o': {
      'es': '5 mins ago',
      'en': '',
    },
    'zewnt25t': {
      'es': 'Head of Design',
      'en': '',
    },
    'lp20pyg6': {
      'es': 'Mario C. (Híbrido)',
      'en': '',
    },
    '4k86g2a4': {
      'es': 'Email:',
      'en': '',
    },
    'x910kbdp': {
      'es': 'mario@test.com',
      'en': '',
    },
    'tb82epv7': {
      'es': 'Status:',
      'en': '',
    },
    '9hvq7qda': {
      'es': 'Inactivo',
      'en': '',
    },
    'df0rqe8o': {
      'es': 'Reactivar',
      'en': '',
    },
    'pghy9o5o': {
      'es': 'ELIMINAR USUARIO',
      'en': '',
    },
    'bc66alb8': {
      'es': 'AGREGAR USUARIO MANUALMENTE',
      'en': '',
    },
    'gzj9a98z': {
      'es': 'Home',
      'en': '',
    },
  },
  // CreditRepairDashboard
  {
    '3cooyybk': {
      'es': 'Métricas del departamento.',
      'en': '',
    },
    'ffcke4ev': {
      'es': '16',
      'en': '',
    },
    '9rdopwfh': {
      'es': 'Clientes Activos',
      'en': '',
    },
    'uvexiaah': {
      'es': '16',
      'en': '',
    },
    '674haq0y': {
      'es': 'Overdue',
      'en': '',
    },
    'r7w7chgk': {
      'es': '16',
      'en': '',
    },
    '47gjty3z': {
      'es': 'Upcoming\nUpdates',
      'en': '',
    },
    'dauhuec2': {
      'es': 'Search all users...',
      'en': '',
    },
    '05yfi1mp': {
      'es': 'Busca por nombre o email...',
      'en': '',
    },
    'wf070o42': {
      'es': 'Ana Lopez',
      'en': '',
    },
    'n51tr36c': {
      'es': 'Proxima disputa:',
      'en': '',
    },
    'ar7shpu2': {
      'es': 'June 6, 2026',
      'en': '',
    },
    '1xszinml': {
      'es': 'Ronda actual: ',
      'en': '',
    },
    'ado0swdj': {
      'es': 'Ronda 2',
      'en': '',
    },
    '6btr14fh': {
      'es': '(Día 25/31)',
      'en': '',
    },
    'l3o6mv4u': {
      'es': 'Puntuación Actual:',
      'en': '',
    },
    'trw5x7wo': {
      'es': 'TU:',
      'en': '',
    },
    'sc58fl6v': {
      'es': '514',
      'en': '',
    },
    'etgo54va': {
      'es': 'EX',
      'en': '',
    },
    'hyn8otes': {
      'es': '488',
      'en': '',
    },
    '6453cnpd': {
      'es': 'EQ:',
      'en': '',
    },
    'tubcbcki': {
      'es': '505',
      'en': '',
    },
    'v5q4j0i4': {
      'es': 'Días pendientes',
      'en': '',
    },
    'crporgah': {
      'es': '6',
      'en': '',
    },
    'gr9xkx9f': {
      'es': 'Actualizar Reporte',
      'en': '',
    },
    'tlkv7piq': {
      'es': 'Ver  PDF',
      'en': '',
    },
    'h1izqr0t': {
      'es': 'Samantha Chávez',
      'en': '',
    },
    'r2baupr9': {
      'es': 'Proxima disputa:',
      'en': '',
    },
    'wtnnqw99': {
      'es': 'Sin comenzar',
      'en': '',
    },
    'zfmyrzag': {
      'es': 'Ronda actual: ',
      'en': '',
    },
    '7ve8o5qi': {
      'es': 'Pendiente Ronda 1 ',
      'en': '',
    },
    'pnkn7f63': {
      'es': '(Día 0/31)',
      'en': '',
    },
    'ywam0jrd': {
      'es': 'Puntuación Actual:',
      'en': '',
    },
    'ck3srwp4': {
      'es': 'TU:',
      'en': '',
    },
    'i6y1uvwn': {
      'es': '000',
      'en': '',
    },
    'l3uwp0na': {
      'es': 'EX',
      'en': '',
    },
    'blj7j0gh': {
      'es': '000',
      'en': '',
    },
    '3jv72xzh': {
      'es': 'EQ:',
      'en': '',
    },
    'zqw25nfp': {
      'es': '000',
      'en': '',
    },
    'tsf5pibw': {
      'es': 'Comenzar Ronda',
      'en': '',
    },
    'y2y5b0f5': {
      'es': 'Hector Osorio',
      'en': '',
    },
    '4manyfye': {
      'es': 'Proxima disputa:',
      'en': '',
    },
    's7v3llrj': {
      'es': 'June 6, 2026',
      'en': '',
    },
    '7vu31lji': {
      'es': 'Ronda actual: ',
      'en': '',
    },
    'huhyv7jn': {
      'es': 'Ronda 2 ',
      'en': '',
    },
    'duz2o2w2': {
      'es': '(Día 31/31)',
      'en': '',
    },
    'vqxytq30': {
      'es': 'Puntuación Actual:',
      'en': '',
    },
    'r0dzwavc': {
      'es': 'TU:',
      'en': '',
    },
    'i4caawju': {
      'es': '514',
      'en': '',
    },
    '6133xjqw': {
      'es': 'EX',
      'en': '',
    },
    'cvn7x9pq': {
      'es': '488',
      'en': '',
    },
    '1c6gi1y8': {
      'es': 'EQ:',
      'en': '',
    },
    'bdz7r38w': {
      'es': '505',
      'en': '',
    },
    '3trbs60u': {
      'es': 'Listo para actualizar',
      'en': '',
    },
    'u02m1pyl': {
      'es': '!',
      'en': '',
    },
    'd30rt4by': {
      'es': 'Ver  PDF',
      'en': '',
    },
    'lcjvbr0y': {
      'es': 'Credit Repair Cloud',
      'en': '',
    },
    'g2dtmf28': {
      'es': 'Home',
      'en': '',
    },
  },
  // Prestamos
  {
    'xabb5suk': {
      'es': 'Financiamiento',
      'en': '',
    },
    'g7q3prur': {
      'es': 'Métricas del departamento',
      'en': '',
    },
    'xkyoprrk': {
      'es': 'EN PIPELINE',
      'en': '',
    },
    'e8yeg03s': {
      'es': '22',
      'en': '',
    },
    'lmz3v16g': {
      'es': '\$4.5M Vol.',
      'en': '',
    },
    'ha2i7izu': {
      'es': 'Docs. Pendientes.',
      'en': '',
    },
    'uu6dua6w': {
      'es': '3',
      'en': '',
    },
    'btbp4ljo': {
      'es': 'Urgente',
      'en': '',
    },
    'b69c9fva': {
      'es': 'FILTRAR POR ESTATUS',
      'en': '',
    },
    'ayll3y4n': {
      'es': 'Todos',
      'en': '',
    },
    '9iw4ysye': {
      'es': 'Faltan Docs',
      'en': '',
    },
    '7y1l6qdf': {
      'es': 'Aprobados',
      'en': '',
    },
    'udi4qot6': {
      'es': 'Cliente: ',
      'en': '',
    },
    'e4zs4oxv': {
      'es': 'Mario C.',
      'en': '',
    },
    'mu9hnb0d': {
      'es': 'Broker: ',
      'en': '',
    },
    'wn5d65go': {
      'es': 'Fernando Elvir',
      'en': '',
    },
    '3tgw17fe': {
      'es': 'Monto: ',
      'en': '',
    },
    'km2wbk6m': {
      'es': '\$350,000',
      'en': '',
    },
    '5fbxwasv': {
      'es': 'Estatus: ',
      'en': '',
    },
    't77kmii7': {
      'es': 'En Revisión',
      'en': '',
    },
    'dhicszq1': {
      'es': 'Ver File',
      'en': '',
    },
    'edrdjqo4': {
      'es': 'Contactar',
      'en': '',
    },
    '96w87t9k': {
      'es': 'Cliente: ',
      'en': '',
    },
    'vyp5m537': {
      'es': 'Cécar M.',
      'en': '',
    },
    'o9p53xh6': {
      'es': 'Broker: ',
      'en': '',
    },
    'cmooxztk': {
      'es': 'Sam C.',
      'en': '',
    },
    'thm4ihd1': {
      'es': 'Monto: ',
      'en': '',
    },
    '3kdkzs4v': {
      'es': '\$125,000',
      'en': '',
    },
    'bdeelmue': {
      'es': 'Pendiente: ',
      'en': '',
    },
    'fuwiq9mj': {
      'es': 'Bank Statements 4 meses',
      'en': '',
    },
    '3xv4x6gx': {
      'es': 'Estatus: ',
      'en': '',
    },
    '262oulty': {
      'es': 'En Revisión',
      'en': '',
    },
    'rdlf9e8e': {
      'es': 'Subir Documento',
      'en': '',
    },
    'hokrgxya': {
      'es': 'Alertar',
      'en': '',
    },
    'lhs1f1sj': {
      'es': 'Home',
      'en': '',
    },
  },
  // VentasYCobros
  {
    'qsb37qhq': {
      'es': 'Ventas y Cobros',
      'en': '',
    },
    'av6vd9r4': {
      'es': 'BALANCE DEL MES',
      'en': '',
    },
    'anoih2k6': {
      'es': '\$12,460.00',
      'en': '',
    },
    '8vz54qb5': {
      'es': 'Cobrado',
      'en': '',
    },
    '830dsffv': {
      'es': '\$1,250.00',
      'en': '',
    },
    'k5wuvx7k': {
      'es': 'Pendiente',
      'en': '',
    },
    'yj1g2qy2': {
      'es': '5 ',
      'en': '',
    },
    'awxqnuo0': {
      'es': 'Casos',
      'en': '',
    },
    'iwjxmey9': {
      'es': 'ATRASOS Y PRÓXIMOS COBROS',
      'en': '',
    },
    'cgmgrb29': {
      'es': 'César M. ',
      'en': '',
    },
    '9tvtyv3c': {
      'es': '(E360 Member)',
      'en': '',
    },
    '3j0abw6v': {
      'es': 'Vendedor: ',
      'en': '',
    },
    '8bssp6bj': {
      'es': 'Fernando Elvir',
      'en': '',
    },
    'twz9gvzd': {
      'es': 'Plan: ',
      'en': '',
    },
    'vef5dsop': {
      'es': '3 ',
      'en': '',
    },
    'ryiidee7': {
      'es': 'Cuotas de ',
      'en': '',
    },
    'ssiwkuq2': {
      'es': '\$250',
      'en': '',
    },
    'y2917wq3': {
      'es': 'Estado: ',
      'en': '',
    },
    'q340pm7k': {
      'es': 'Cuota ',
      'en': '',
    },
    'f1a8o2hf': {
      'es': '2 de 3',
      'en': '',
    },
    'lm8ds8kp': {
      'es': 'Vencimiento: ',
      'en': '',
    },
    '1ptpvenc': {
      'es': '🔴 HOY (16/Abr)',
      'en': '',
    },
    'nidmufvm': {
      'es': 'Recordatorio',
      'en': '',
    },
    '7p18y8gf': {
      'es': 'Cobrar',
      'en': '',
    },
    'g4eqcpjm': {
      'es': 'Mario C. ',
      'en': '',
    },
    'dhw3n47l': {
      'es': '(E360 Member)',
      'en': '',
    },
    'mn7gksdu': {
      'es': 'Vendedor: ',
      'en': '',
    },
    'muhgnkor': {
      'es': 'Emely',
      'en': '',
    },
    '24m3a481': {
      'es': 'Plan: ',
      'en': '',
    },
    '551xgwrb': {
      'es': 'Plan Único ',
      'en': '',
    },
    'firi623x': {
      'es': '\$750',
      'en': '',
    },
    '13wue8xp': {
      'es': 'Estado: ',
      'en': '',
    },
    'yc5tew9q': {
      'es': 'Pendiente de Cierre',
      'en': '',
    },
    '3ivlu8fw': {
      'es': 'Vencimiento: ',
      'en': '',
    },
    '6eb3f3cp': {
      'es': '🟡 En 2 días',
      'en': '',
    },
    'sz6nxnxn': {
      'es': 'Recordatorio',
      'en': '',
    },
    '4a3yizyv': {
      'es': 'Cobrar',
      'en': '',
    },
    'pyie5a6d': {
      'es': 'Home',
      'en': '',
    },
  },
  // SetupAndMarketing
  {
    '2h9f7elw': {
      'es': 'FLUJO DE TRABAJO (KPIs)',
      'en': '',
    },
    'x4ieq3yk': {
      'es': '4',
      'en': '',
    },
    'djwddqmw': {
      'es': 'GHL Pendiente',
      'en': '',
    },
    '4z99buo5': {
      'es': '2',
      'en': '',
    },
    'kktppw11': {
      'es': 'Material PDT.',
      'en': '',
    },
    '051sz0n5': {
      'es': 'PIPELINE DE NUEVOS BROKERS',
      'en': '',
    },
    'xlq6r9ge': {
      'es': 'Crear GHL',
      'en': '',
    },
    'pdgziiqe': {
      'es': 'Esperando Pago',
      'en': '',
    },
    's0rhdjie': {
      'es': 'Entregar Arte',
      'en': '',
    },
    '7rl98iu2': {
      'es': 'LISTA DE TAREAS',
      'en': '',
    },
    '9128z014': {
      'es': 'Activas',
      'en': '',
    },
    'ariy1042': {
      'es': 'TAREA: ',
      'en': '',
    },
    'k9eaquxg': {
      'es': 'CREAR SUBCUENTA GHL',
      'en': '',
    },
    'vfa55abz': {
      'es': 'GHL Form: ',
      'en': '',
    },
    'wt4ej3wb': {
      'es': 'Luis Torres',
      'en': '',
    },
    'b3j8rmih': {
      'es': 'GHL Form: ',
      'en': '',
    },
    'eubl2e6b': {
      'es': 'Recibido',
      'en': '',
    },
    '6slm58p8': {
      'es': 'Pago: ',
      'en': '',
    },
    'jwdzu8am': {
      'es': 'Parcial (Cuota 1 de 3)',
      'en': '',
    },
    'a8v9dokp': {
      'es': 'Estatus: ',
      'en': '',
    },
    'ps33jzl2': {
      'es': '🟠 Esperando Snapshot',
      'en': '',
    },
    'o381zawf': {
      'es': 'Ver Formulario',
      'en': '',
    },
    'b7uc1576': {
      'es': 'GHL Listo',
      'en': '',
    },
    'djto9069': {
      'es': 'TAREA: ',
      'en': '',
    },
    '6909w4sx': {
      'es': 'MATERIAL DE MERCADEO',
      'en': '',
    },
    '8rugfpxn': {
      'es': 'Nuevo Broker: ',
      'en': '',
    },
    'hwiy8zjs': {
      'es': 'Valeria C.',
      'en': '',
    },
    '9m13chv6': {
      'es': 'GHL Form: ',
      'en': '',
    },
    '0leht1g3': {
      'es': 'Completado',
      'en': '',
    },
    'hrjh1mdr': {
      'es': 'Pago: ',
      'en': '',
    },
    'gdlqses1': {
      'es': '🟢 100% PAGADO',
      'en': '',
    },
    '12ktb0az': {
      'es': '⚠️ TIEMPO LÍMITE:',
      'en': '',
    },
    '2xlvtsjm': {
      'es': '🟠 36h restantes',
      'en': '',
    },
    'vw1gu0hh': {
      'es': 'Subir Material',
      'en': '',
    },
    'jts49g9i': {
      'es': 'Completar',
      'en': '',
    },
    '53fnr2x9': {
      'es': 'TAREA: ',
      'en': '',
    },
    '4z551mwu': {
      'es': 'BLOQUEADA',
      'en': '',
    },
    'mdtqysjb': {
      'es': 'Nuevo Broker: ',
      'en': '',
    },
    'r0fqfat6': {
      'es': 'Roberto Gómez',
      'en': '',
    },
    'ububew4w': {
      'es': 'GHL Subcuenta: ',
      'en': '',
    },
    'ktbiz0oi': {
      'es': 'Creada',
      'en': '',
    },
    '3oim5e92': {
      'es': 'Pago: ',
      'en': '',
    },
    'ozggrmlx': {
      'es': '🔴 Falta Cuota Final',
      'en': '',
    },
    '8a5zkhrv': {
      'es': 'Estatus: ',
      'en': '',
    },
    '0gnhcwv8': {
      'es': '🟠 Esperando cobro de Emily',
      'en': '',
    },
    'q9ufh3qh': {
      'es': 'Bloqueado',
      'en': '',
    },
    'kgmwa0mf': {
      'es': 'Setup & Marketing',
      'en': '',
    },
    'b15shnqh': {
      'es': 'Home',
      'en': '',
    },
  },
  // ClientProfile
  {
    'zdfm2y68': {
      'es': 'César M.',
      'en': '',
    },
    'htnu77b3': {
      'es': 'Email:',
      'en': '',
    },
    '8ft8hzi5': {
      'es': 'cesar@e360.com',
      'en': '',
    },
    'zxujcnql': {
      'es': 'Broker',
      'en': '',
    },
    'd42xj003': {
      'es': 'Híbrido',
      'en': '',
    },
    'mats2hqu': {
      'es': 'Accesos concedidos',
      'en': '',
    },
    'cfpn98p2': {
      'es': 'Acceso total a herramientas E360 Package',
      'en': '',
    },
    'jp6e54j5': {
      'es': 'Monto pendiente:',
      'en': '',
    },
    '6w7uy0zv': {
      'es': '\$250.00',
      'en': '',
    },
    'mgeeosim': {
      'es': 'Total Pagado: \$500.00 (66%)',
      'en': '',
    },
    '58s53h8d': {
      'es': 'Vencimiento: HOY (16/Abril)',
      'en': '',
    },
    'jinan2bw': {
      'es': 'Make a Payment',
      'en': '',
    },
    'qjenj4c8': {
      'es': 'Check all previus invoices',
      'en': '',
    },
    'uubnuc49': {
      'es': 'REPARACIÓN DE CRÉDITO',
      'en': '',
    },
    'p5f3qoth': {
      'es': 'Estatus: ',
      'en': '',
    },
    'cmpsgvwi': {
      'es': '🟠 Esperando Burós',
      'en': '',
    },
    'ed42l8c5': {
      'es': 'Progreso: ',
      'en': '',
    },
    'q67v3kt2': {
      'es': 'Ronda 2 (Día 35/40)',
      'en': '',
    },
    'v5t51b98': {
      'es': 'TU: 514 🔴',
      'en': '',
    },
    'nc762fnl': {
      'es': 'EX: 488 🔴',
      'en': '',
    },
    'rg787p5j': {
      'es': 'EQ: 505 🔴',
      'en': '',
    },
    'x2yzalsw': {
      'es': '1',
      'en': '',
    },
    'jl0bswaw': {
      'es': 'Ver reporte de crédito PDF',
      'en': '',
    },
    'kpg7yoec': {
      'es': 'ONBOARDING & SETUP',
      'en': '',
    },
    'd45x6cj3': {
      'es': 'Subcuenta GHL: ',
      'en': '',
    },
    'sc7yt53k': {
      'es': '✅ Activa',
      'en': '',
    },
    'ij115vqi': {
      'es': 'Kit de Marketing: ',
      'en': '',
    },
    'xubl1dp3': {
      'es': '🚫 Bloqueado ',
      'en': '',
    },
    'yjku0fzz': {
      'es': '(Requiere 100% del pago)',
      'en': '',
    },
    'i082tsng': {
      'es': 'Inducción: ',
      'en': '',
    },
    'la965d3b': {
      'es': '⏳ Pendiente',
      'en': '',
    },
    'act084zy': {
      'es': 'ACCIONES DE ADMINISTRADOR',
      'en': '',
    },
    '6jvmhn3y': {
      'es': 'SUSPENDER ACCESO AL SISTEMA',
      'en': '',
    },
    'n9rkos9d': {
      'es': 'PERFIL PRINCIPAL',
      'en': '',
    },
    'k90oczlf': {
      'es': 'Home',
      'en': '',
    },
  },
  // Onboarding
  {
    'fruizjsj': {
      'es': 'Operaciones: Inducción',
      'en': '',
    },
    'y5bktgpp': {
      'es': 'RESUMEN DE ONBOARDING',
      'en': '',
    },
    'kh15kr6a': {
      'es': 'PENDIENTES',
      'en': '',
    },
    'ntkzluaf': {
      'es': '6',
      'en': '',
    },
    'r5ethof9': {
      'es': 'Esta semana',
      'en': '',
    },
    't6w749lt': {
      'es': 'COMPLETADOS',
      'en': '',
    },
    'uuikrhca': {
      'es': '14',
      'en': '',
    },
    'fqe47ahm': {
      'es': '🟢 Buen Ritmo',
      'en': '',
    },
    'cu7eaizg': {
      'es': 'COLA DE ESPERA',
      'en': '',
    },
    'ins80czd': {
      'es': 'Por Iniciar',
      'en': '',
    },
    'brdx3ucy': {
      'es': 'En Curso',
      'en': '',
    },
    'evjxfbuj': {
      'es': 'Falta de asistencia',
      'en': '',
    },
    'u7k0vi38': {
      'es': 'Broker: ',
      'en': '',
    },
    'jnswkrka': {
      'es': 'Luis Torres',
      'en': '',
    },
    'pkk81lxx': {
      'es': 'GHL Setup: ',
      'en': '',
    },
    'vehi6t1e': {
      'es': '✅ Finalizado por Sam',
      'en': '',
    },
    'zw5y3fxy': {
      'es': 'Tiempo en espera: ',
      'en': '',
    },
    '2fqydtv7': {
      'es': '4 horas',
      'en': '',
    },
    'c7up985b': {
      'es': 'TAREAS DE LAURA:',
      'en': '',
    },
    '40g5dula': {
      'es': 'Acceso a Cursos',
      'en': '',
    },
    'lqfhvuo5': {
      'es': 'WhatsApp',
      'en': '',
    },
    'b3akej0k': {
      'es': 'Asignar a Laura S.',
      'en': '',
    },
    'lf4cv3cm': {
      'es': 'Broker: ',
      'en': '',
    },
    '03upe1a0': {
      'es': 'Valeria C.',
      'en': '',
    },
    '6kbtlmo6': {
      'es': 'GHL Setup: ',
      'en': '',
    },
    'hunge0ix': {
      'es': '✅ Finalizado por Sam',
      'en': '',
    },
    'efvfkucy': {
      'es': 'Tiempo en espera: ',
      'en': '',
    },
    's1nj67pz': {
      'es': 'Ayer',
      'en': '',
    },
    'vhbkk1w3': {
      'es': 'ASIGNADA A: 👩‍💼 Laura Núñez',
      'en': '',
    },
    'go2irqi5': {
      'es': 'Acceso a Cursos',
      'en': '',
    },
    '334qdi7n': {
      'es': 'WhatsApp',
      'en': '',
    },
    'ek7qgbj6': {
      'es': 'Llamar',
      'en': '',
    },
    'lzsqb3pr': {
      'es': 'Finalizar',
      'en': '',
    },
    'i2p34q0d': {
      'es': 'Home',
      'en': '',
    },
  },
  // MiPortalE360
  {
    'a685bj61': {
      'es': '🚀 TU PROGRESO DE ONBOARDING',
      'en': '',
    },
    'i2wp75zi': {
      'es': '1. Pago Confirmado',
      'en': '',
    },
    'r3dkq0db': {
      'es': '2. Cuestionario Inicial',
      'en': '',
    },
    'bievd8z1': {
      'es': '3. Configuración de CRM',
      'en': '',
    },
    'q7ys3m1x': {
      'es': '4. Llamada de Inducción',
      'en': '',
    },
    '53crc2yx': {
      'es': '5. Entrega de Kit de Marca',
      'en': '',
    },
    'u84jau8c': {
      'es':
          '⏳ Estatus Actual: Nuestro equipo técnico está creando tu sistema. Te notificaremos en 24-48h.',
      'en': '',
    },
    '9j7mql3n': {
      'es': 'HERRAMIENTAS DE APRENDIZAJE',
      'en': '',
    },
    '5xbsoke7': {
      'es': '🎓 E360 Library',
      'en': '',
    },
    'lr2oxvt2': {
      'es': 'Empieza a estudiar mientras preparamos tu sistema.',
      'en': '',
    },
    'nyool7x1': {
      'es': 'Ir a los Cursos',
      'en': '',
    },
    'n5kdu79j': {
      'es': 'MI NEGOCIO',
      'en': '',
    },
    'xwxsoqak': {
      'es': '0',
      'en': '',
    },
    'c64myycm': {
      'es': 'Ventas en este mes',
      'en': '',
    },
    'toelmbvq': {
      'es': '\$0',
      'en': '',
    },
    '50qwovoq': {
      'es': 'Comisiones disponibles',
      'en': '',
    },
    'vbn2phwn': {
      'es': '0',
      'en': '',
    },
    'f8iutqb6': {
      'es': 'Clientes en proceso de reparación de crédito.',
      'en': '',
    },
    'k0tg9vok': {
      'es': '¡Hola, Luis! 👋',
      'en': '',
    },
    '9lwrw862': {
      'es': 'Bienvenido a tu nueva agencia.',
      'en': '',
    },
    '0g4c747g': {
      'es': 'Home',
      'en': '',
    },
  },
  // PortafoliodelBroker
  {
    '87n3y1i2': {
      'es': 'RESUMEN DE GANANCIAS',
      'en': '',
    },
    'jjbnutyq': {
      'es': 'Comisiones Acumuladas:',
      'en': '',
    },
    'k4ich0ws': {
      'es': '\$1,250.00',
      'en': '',
    },
    'qlfk9ix3': {
      'es': 'Próximo Pago:',
      'en': '',
    },
    'ioz02m4q': {
      'es': '\$350.00',
      'en': '',
    },
    'tnqddqlw': {
      'es': '(20/Abr)',
      'en': '',
    },
    'rqtbez59': {
      'es': 'BUSCAR REFERIDO',
      'en': '',
    },
    'c7a6083c': {
      'es': 'Nombre del cliente...',
      'en': '',
    },
    '4naibln5': {
      'es': 'Roberto Gómez',
      'en': '',
    },
    'tn595d7s': {
      'es': 'Servicio:',
      'en': '',
    },
    'xfbzoipp': {
      'es': 'Reparación de Crédito',
      'en': '',
    },
    '1xwpwa78': {
      'es': 'Estatus:',
      'en': '',
    },
    '1zwr5k2d': {
      'es': '🟢 Ronda 2 en Proceso',
      'en': '',
    },
    'pq9l71zt': {
      'es': 'Última actualización: Ayer',
      'en': '',
    },
    'orrdc5pn': {
      'es': 'Ver Detalle',
      'en': '',
    },
    '1kuqr48q': {
      'es': 'Contactar',
      'en': '',
    },
    '8r1b4m2h': {
      'es': 'Valeria Torres',
      'en': '',
    },
    'hp50g1r6': {
      'es': 'Servicio:',
      'en': '',
    },
    'rmz913ol': {
      'es': 'Préstamo Comercial',
      'en': '',
    },
    'lrin82bf': {
      'es': 'Estatus:',
      'en': '',
    },
    'z7q3gn5x': {
      'es': '🟡 Esperando Documentos',
      'en': '',
    },
    'sgq85bxy': {
      'es': 'Última actualización: Ayer',
      'en': '',
    },
    '7y5ahflj': {
      'es': 'Ver Detalle',
      'en': '',
    },
    'hj8dej4c': {
      'es': 'Contactar',
      'en': '',
    },
    's9hqaj8e': {
      'es': 'REGISTRAR NUEVO LEAD',
      'en': '',
    },
    '6j9bc1f4': {
      'es': 'Mis Clientes',
      'en': '',
    },
    'ukunpg9d': {
      'es': 'Home',
      'en': '',
    },
  },
  // SubmitLead
  {
    'xkmiqa11': {
      'es': '1.',
      'en': '',
    },
    'nj6ktqfl': {
      'es': 'Tipo de servicio.',
      'en': '',
    },
    'ooxktmtb': {
      'es': 'Residencial',
      'en': '',
    },
    '2gzm7m6z': {
      'es': 'Comercial',
      'en': '',
    },
    'nbcrdrw9': {
      'es': 'Personal',
      'en': '',
    },
    'v5sk8zw3': {
      'es': 'Tarjeta de crédito para negocio',
      'en': '',
    },
    'f9tv155c': {
      'es': 'Empresarial',
      'en': '',
    },
    '1870jsed': {
      'es': '2.',
      'en': '',
    },
    'vm7zy2i4': {
      'es': 'Datos del cliente.',
      'en': '',
    },
    '8jgwuj3i': {
      'es': 'Nombre Completo',
      'en': '',
    },
    '3vmkr3b0': {
      'es': 'Correo Electrónico',
      'en': '',
    },
    'fjbijc0a': {
      'es': 'Teléfono',
      'en': '',
    },
    'nmc5m1ib': {
      'es': 'SSN / ITIN',
      'en': '',
    },
    'nptlf1oo': {
      'es': '3.',
      'en': '',
    },
    '72jx4d1v': {
      'es': 'Documentos requeridos.',
      'en': '',
    },
    'ye64wmu3': {
      'es': 'Sube los archivos en formato PDF o JPG',
      'en': '',
    },
    'dfrbrxme': {
      'es': 'Identificación Oficial (ID)',
      'en': '',
    },
    'dfzq129h': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'b41h64aa': {
      'es': 'Estados de Cuenta (3 meses)',
      'en': '',
    },
    '8oyxn1am': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'diib9ylj': {
      'es': 'SOMETER APLICACIÓN',
      'en': '',
    },
    'fwkxw437': {
      'es': 'Registrar Aplicación',
      'en': '',
    },
    'ivt6jj13': {
      'es': 'Home',
      'en': '',
    },
  },
  // MarketingHub
  {
    'kimobm9x': {
      'es': 'Materia de mercadeo gratuito.',
      'en': '',
    },
    '5bsj9684': {
      'es': 'Entregado:',
      'en': '',
    },
    'l2ksw5gi': {
      'es': '5/15/2026',
      'en': '',
    },
    '9umibdi6': {
      'es': 'Galería de recursos.',
      'en': '',
    },
    'enxbkp1w': {
      'es': 'Reparación A',
      'en': '',
    },
    'dnihju3b': {
      'es': 'Tip de Score',
      'en': '',
    },
    'qkb7tbcd': {
      'es': 'Préstamo Casa',
      'en': '',
    },
    'e09dk9d0': {
      'es': 'Business Loan',
      'en': '',
    },
    'rjv1fbw6': {
      'es': 'DESCARGAR TODO EL KIT',
      'en': '',
    },
    'uz91rifk': {
      'es': 'Marketing Hub',
      'en': '',
    },
    '4j3pkb6x': {
      'es': 'Home',
      'en': '',
    },
  },
  // PortalRL
  {
    '4jedza0n': {
      'es': 'SERVICIOS COMPLEJOS,\nEJECUCIÓN PROFESIONAL',
      'en': '',
    },
    '01xbctw9': {
      'es': '¿Qué trámite necesita tu cliente?',
      'en': '',
    },
    'e1v8qhi3': {
      'es': 'Registro de Empresas',
      'en': '',
    },
    'v0csqpq2': {
      'es': 'LLC Nacional e Internacional',
      'en': '',
    },
    'n8qhdk7c': {
      'es': 'Iniciar Solicitud',
      'en': '',
    },
    'hlhcaxuw': {
      'es': 'Procesos Migratorios',
      'en': '',
    },
    'izrg5yby': {
      'es': 'Asilos, Permisos, Peticiones',
      'en': '',
    },
    'b5tk4285': {
      'es': 'Iniciar Solicitud',
      'en': '',
    },
    '8vk6v3ej': {
      'es': 'Taxes e ITIN',
      'en': '',
    },
    'ddil1cd8': {
      'es': 'Personales y Corporativos',
      'en': '',
    },
    'hffdj085': {
      'es': 'Iniciar Solicitud',
      'en': '',
    },
    '48nervyc': {
      'es': 'Bookkeeping',
      'en': '',
    },
    '7kvzql9l': {
      'es': 'Contabilidad Continua',
      'en': '',
    },
    '6cv5na1m': {
      'es': 'Iniciar Solicitud',
      'en': '',
    },
    '2haia0wv': {
      'es': 'RL Partners Center',
      'en': '',
    },
    'vbpk8ngl': {
      'es': 'Home',
      'en': '',
    },
  },
  // RegistrodeEmpresa
  {
    '8otnnbxk': {
      'es': '1.',
      'en': '',
    },
    'oz98agi9': {
      'es': 'TIPO DE REGISTRO',
      'en': '',
    },
    'g45qldyk': {
      'es': 'LLC Nacional',
      'en': '',
    },
    'l9tw5mcu': {
      'es': 'LLC Internacional',
      'en': '',
    },
    'mej59kh5': {
      'es': '2.',
      'en': '',
    },
    '241gpbgk': {
      'es': 'DATOS DEL TITULAR',
      'en': '',
    },
    'kww691ex': {
      'es': 'Nombre Completo',
      'en': '',
    },
    '1qw6z5ko': {
      'es': 'Correo Electrónico',
      'en': '',
    },
    '280kqh1z': {
      'es': 'Teléfono',
      'en': '',
    },
    'bwbcttvy': {
      'es': '3.',
      'en': '',
    },
    'jbo1elh3': {
      'es': 'DETALLES DE LA EMPRESA',
      'en': '',
    },
    '4gwzh3c0': {
      'es': 'Nombre deseado para la LLC',
      'en': '',
    },
    'vkt1gm11': {
      'es': 'Estado de Registro (Ej. FL)',
      'en': '',
    },
    'hrvplsck': {
      'es': 'País de Origen',
      'en': '',
    },
    'o2y623ks': {
      'es': '4.',
      'en': '',
    },
    'xhs3iy5k': {
      'es': 'Documentos requeridos.',
      'en': '',
    },
    'gmkrg9vu': {
      'es': 'Sube los archivos en formato PDF o JPG',
      'en': '',
    },
    'ywic0bwx': {
      'es': 'Pasaporte o ID Oficial',
      'en': '',
    },
    'q6ghdpjc': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'djmewblg': {
      'es': 'ENVIAR SOLICITUD A RL',
      'en': '',
    },
    'pf6yqj7r': {
      'es': 'Registro de Empresas',
      'en': '',
    },
    'uw0ak6oq': {
      'es': 'Home',
      'en': '',
    },
  },
  // ProgresosMigratorios
  {
    'tqwky4ln': {
      'es': '1.',
      'en': '',
    },
    'o1h79g76': {
      'es': 'TIPO DE TRÁMITE',
      'en': '',
    },
    'unfkgvm9': {
      'es': 'Asilo',
      'en': '',
    },
    'kn0o9b9k': {
      'es': 'Permiso de Trabajo',
      'en': '',
    },
    '8hdjymzg': {
      'es': 'Ciudadanía',
      'en': '',
    },
    '28xf87kk': {
      'es': 'Residencia',
      'en': '',
    },
    '4kjjw7cf': {
      'es': 'Petición Familiar',
      'en': '',
    },
    '1aqw6ne3': {
      'es': '2.',
      'en': '',
    },
    'jpmh083w': {
      'es': 'DETALLE DEL TRÁMITE',
      'en': '',
    },
    'jkbw8crs': {
      'es': 'Tipo de Permiso',
      'en': '',
    },
    'xjrd228y': {
      'es': 'Search...',
      'en': '',
    },
    'yf4bkrdl': {
      'es': '1era Vez',
      'en': '',
    },
    '7arf8qgq': {
      'es': 'Renovación',
      'en': '',
    },
    '8flsf0sy': {
      'es': 'Reemplazo',
      'en': '',
    },
    'jnen5e4j': {
      'es': 'Tipo de Petición',
      'en': '',
    },
    'awpcphed': {
      'es': 'Search...',
      'en': '',
    },
    '0p2uc9nd': {
      'es': 'A esposo/a',
      'en': '',
    },
    'mptkzttr': {
      'es': 'A padres',
      'en': '',
    },
    'kwsetm93': {
      'es': '3.',
      'en': '',
    },
    '7dos210y': {
      'es': 'DATOS DEL SOLICITANTE',
      'en': '',
    },
    'oydcu3g6': {
      'es': 'Nombre Completo',
      'en': '',
    },
    'm2ii6sof': {
      'es': 'Correo Electrónico',
      'en': '',
    },
    '1j5gnmi3': {
      'es': 'Teléfono',
      'en': '',
    },
    'r1linx5e': {
      'es': 'TextField',
      'en': '',
    },
    'nxwrdc3e': {
      'es': 'País de Nacimiento',
      'en': '',
    },
    '0mx2goxx': {
      'es': '4.',
      'en': '',
    },
    'u8v4kgoe': {
      'es': 'Documentos requeridos.',
      'en': '',
    },
    '96eojkh6': {
      'es': 'Sube los archivos en formato PDF o JPG',
      'en': '',
    },
    'qwtqh52i': {
      'es': 'Pasaporte Vigente',
      'en': '',
    },
    'knjnuh70': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'ejhlk4uu': {
      'es': 'Copia del Permiso Anterior',
      'en': '',
    },
    'xpquyy4i': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'wcc06k3p': {
      'es': 'Certificado de Matrimonio/Nac.',
      'en': '',
    },
    'kkpaczfa': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'diqo69ch': {
      'es': 'ENVIAR SOLICITUD A RL',
      'en': '',
    },
    'fblkzcrh': {
      'es': 'Procesos Migratorios',
      'en': '',
    },
    '44jpmbnu': {
      'es': 'Home',
      'en': '',
    },
  },
  // TaxesITIN
  {
    'i570ttfm': {
      'es': '1.',
      'en': '',
    },
    'zfkvn9ta': {
      'es': 'TIPO DE REGISTRO',
      'en': '',
    },
    '72gk1wfa': {
      'es': 'Solicitud de ITIN',
      'en': '',
    },
    'hsmjw39s': {
      'es': 'Taxes Personales',
      'en': '',
    },
    'e9a20w5p': {
      'es': 'Taxes LLC (Hasta 1M)',
      'en': '',
    },
    '6e9xzg18': {
      'es': 'Taxes LLC (Más de 2M)',
      'en': '',
    },
    '1z7zij8k': {
      'es': '2.',
      'en': '',
    },
    'f3vb89jt': {
      'es': 'DATOS DEL SOLICITANTE',
      'en': '',
    },
    'f8614q8j': {
      'es': 'Nombre Completo',
      'en': '',
    },
    '6bpw6pcy': {
      'es': 'Correo Electrónico',
      'en': '',
    },
    '973y6gpj': {
      'es': 'Teléfono',
      'en': '',
    },
    'knk07xp1': {
      'es': 'Nombre de la LLC',
      'en': '',
    },
    'ppvjun7a': {
      'es': 'EIN de la LLC',
      'en': '',
    },
    'j63gmrdc': {
      'es': '4.',
      'en': '',
    },
    '0o6j1oji': {
      'es': 'Documentos requeridos.',
      'en': '',
    },
    'gfvgy0b2': {
      'es': 'Sube los archivos en formato PDF o JPG',
      'en': '',
    },
    'kxdlbcx0': {
      'es': 'Pasaporte o ID Oficial',
      'en': '',
    },
    '82l2t2zk': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'x6968soi': {
      'es': 'Formas W-2 o 1099',
      'en': '',
    },
    'xvq7ldty': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'y0ucpbpk': {
      'es': 'Estados Financieros (P&L)',
      'en': '',
    },
    'eua2jkfv': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'f21bl88q': {
      'es': 'ENVIAR SOLICITUD A RL',
      'en': '',
    },
    'esum51uu': {
      'es': 'Taxes e ITIN',
      'en': '',
    },
    'i4kr8dgc': {
      'es': 'Home',
      'en': '',
    },
  },
  // Bookkeeping
  {
    '8tf7t9ur': {
      'es': '1.',
      'en': '',
    },
    '40dxabg6': {
      'es': 'DATOS DEL CLIENTE',
      'en': '',
    },
    'j6i75ak7': {
      'es': 'Nombre Completo',
      'en': '',
    },
    '5gnj4oak': {
      'es': 'Correo Electrónico',
      'en': '',
    },
    '0glfxknd': {
      'es': 'Teléfono',
      'en': '',
    },
    '3hxr6z8f': {
      'es': '2.',
      'en': '',
    },
    's9bmuv5w': {
      'es': 'DETALLES DE LA EMPRESA',
      'en': '',
    },
    'm15xsi77': {
      'es': 'Nombre de la LLC',
      'en': '',
    },
    'cgdrr22y': {
      'es': 'EIN de la LLC',
      'en': '',
    },
    '3lx0oayc': {
      'es': 'Industria / Giro del negocio',
      'en': '',
    },
    'bwoacu55': {
      'es': '3.',
      'en': '',
    },
    'fvwju1j4': {
      'es': 'VOLUMEN OPERATIVO',
      'en': '',
    },
    'z4oli3b0': {
      'es': 'Cuentas Bancarias a conciliar',
      'en': '',
    },
    'fxt31iw0': {
      'es': 'Search...',
      'en': '',
    },
    't8q9o830': {
      'es': '1',
      'en': '',
    },
    '2bddjh4j': {
      'es': '2',
      'en': '',
    },
    '97t2k2t6': {
      'es': '3',
      'en': '',
    },
    '7gyhwhjm': {
      'es': '4 o más',
      'en': '',
    },
    'kmql1ypr': {
      'es': 'Tarjetas de crédito del neg.',
      'en': '',
    },
    'p3spk50p': {
      'es': 'Search...',
      'en': '',
    },
    '7vq7vl36': {
      'es': '0',
      'en': '',
    },
    'k8cgkg09': {
      'es': '1',
      'en': '',
    },
    'g0hj2alv': {
      'es': '2',
      'en': '',
    },
    'jeslewm9': {
      'es': '3 o más',
      'en': '',
    },
    'vwcai8rm': {
      'es': '4.',
      'en': '',
    },
    'xl9ne7yp': {
      'es': 'Documentos de análisis',
      'en': '',
    },
    '19l789r1': {
      'es': 'Sube los archivos en formato PDF',
      'en': '',
    },
    'afigvgky': {
      'es': 'Últimos 3 Extractos Bancarios',
      'en': '',
    },
    'bdsx86ze': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    '7kvj0nfq': {
      'es': 'Reporte Anterior (Si aplica)',
      'en': '',
    },
    '9z4m46dm': {
      'es': 'Toca para subir archivo',
      'en': '',
    },
    'iv8trgya': {
      'es': 'SOLICITAR COTIZACIÓN A RL',
      'en': '',
    },
    'xkuguohs': {
      'es': 'Bookkeeping',
      'en': '',
    },
    'a3p4vudq': {
      'es': 'Home',
      'en': '',
    },
  },
  // SignUpScreen
  {
    'd39h5j1j': {
      'es': 'Crear Cuenta',
      'en': '',
    },
    'y2crg6kl': {
      'es': 'Fill out the information below in order to create your account.',
      'en': '',
    },
    '470f8p8j': {
      'es': 'Email',
      'en': '',
    },
    'seesgb0l': {
      'es': 'Email',
      'en': '',
    },
    'be64z3pb': {
      'es': 'Password',
      'en': '',
    },
    'f7ct01th': {
      'es': 'Password',
      'en': '',
    },
    'xgji6hlh': {
      'es': 'Confirm Password',
      'en': '',
    },
    '9dx7wsg5': {
      'es': 'Password',
      'en': '',
    },
    'gmai7gwk': {
      'es': 'Sign Up',
      'en': '',
    },
    '4mgcfzgc': {
      'es': 'Or sign up with',
      'en': '',
    },
    'ouuur9f0': {
      'es': 'Continue with Google',
      'en': '',
    },
    'i0a1zdih': {
      'es': '¿Ya tienes cuenta?',
      'en': '',
    },
    'd12y6m2x': {
      'es': ' Inicia Sesión',
      'en': '',
    },
    '57yi1q30': {
      'es': 'Home',
      'en': '',
    },
  },
  // Miscellaneous
  {
    '9dv91enl': {
      'es': '',
      'en': '',
    },
    'ubekbxmd': {
      'es': '',
      'en': '',
    },
    '50rtxoq8': {
      'es': '',
      'en': '',
    },
    'repjc7pd': {
      'es': '',
      'en': '',
    },
    'mvpqkrh3': {
      'es': '',
      'en': '',
    },
    '29jq0mpa': {
      'es': '',
      'en': '',
    },
    'gkwe05ys': {
      'es': '',
      'en': '',
    },
    'y3oho5x8': {
      'es': '',
      'en': '',
    },
    'ydjjm6fd': {
      'es': '',
      'en': '',
    },
    'bfucft4d': {
      'es': '',
      'en': '',
    },
    'cbch1aq0': {
      'es': '',
      'en': '',
    },
    'i29e9v4x': {
      'es': '',
      'en': '',
    },
    '2ipkr9ay': {
      'es': '',
      'en': '',
    },
    '5ygcb1et': {
      'es': '',
      'en': '',
    },
    'kvixp6gr': {
      'es': '',
      'en': '',
    },
    '0d837myc': {
      'es': '',
      'en': '',
    },
    '51akhozt': {
      'es': '',
      'en': '',
    },
    '8bhx9gwb': {
      'es': '',
      'en': '',
    },
    'ld1h57to': {
      'es': '',
      'en': '',
    },
    'mdlacyt1': {
      'es': '',
      'en': '',
    },
    'ye5m6f1n': {
      'es': '',
      'en': '',
    },
    'zpqvwhem': {
      'es': '',
      'en': '',
    },
    '1ghdtzya': {
      'es': '',
      'en': '',
    },
    'c7tkltg8': {
      'es': '',
      'en': '',
    },
    'i2ofomv9': {
      'es': '',
      'en': '',
    },
  },
].reduce((a, b) => a..addAll(b));
