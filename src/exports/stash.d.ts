/**
 * loads data templates & maps from file system
 * @example
 * stash.loadData('./data');
 */
export function loadData(path?: string): void;

/**
 * loads data maps
 * @example
 * stash.addDataMap({
 *  'User': {
 *    'Name': 'Snow',
 *    'Age': 26
 *  }
 * });
 */
export function addDataMap(maps: object): void;
export function addDataMap(maps: object[]): void;

/**
 * loads data templates
 * @example
 * stash.addDataTemplate({
 *  'User.NewUser': {
 *    'Name': 'Snow',
 *    'Age': 26,
 *    'Address': []
 *  }
 * });
 */
export function addDataTemplate(templates: object): void;
export function addDataTemplate(templates: object[]): void;