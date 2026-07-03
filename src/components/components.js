// Stingray Components Library - Material Web Components
// Provides pre-built, styled components using Material Design Web

const COMPONENTS = {
  // Buttons
  Button: {
    tag: 'mdc-button',
    props: ['raised', 'outlined', 'stroked', 'dense', 'fullWidth'],
    events: ['click'],
    render: (props, children) => ({
      type: 'Button',
      variant: props.variant || 'contained',
      size: props.size || 'medium',
      disabled: props.disabled || false,
      children
    })
  },

  Cards: {
    tag: 'mdc-card',
    props: ['elevated', 'outlined', 'shadow'],
    events: [],
    render: (props, children) => ({
      type: 'Card',
      elevation: props.elevation || 1,
      children
    })
  },

  // Text Fields
  TextField: {
    tag: 'mdc-text-field',
    props: ['outlined', 'filled', 'dense', 'disabled', 'required', 'type'],
    events: ['input', 'change', 'focus', 'blur'],
    render: (props, children) => ({
      type: 'TextField',
      variant: props.variant || 'filled',
      label: props.label || '',
      placeholder: props.placeholder || '',
      type: props.type || 'text',
      disabled: props.disabled || false,
      required: props.required || false
    })
  },

  // Switches
  Switch: {
    tag: 'mdc-switch',
    props: ['checked', 'disabled', 'required'],
    events: ['change'],
    render: (props) => ({
      type: 'Switch',
      checked: props.checked || false,
      disabled: props.disabled || false
    })
  },

  // Toggle Buttons
  ToggleButton: {
    tag: 'mdc-toggle-button',
    props: ['selected', 'disabled', 'dense'],
    events: ['click'],
    render: (props, children) => ({
      type: 'ToggleButton',
      selected: props.selected || false,
      children
    })
  },

  // Tabs
  Tabs: {
    tag: 'mdc-tabs',
    props: ['fullWidth', 'dense'],
    events: ['select'],
    render: (props, children) => ({
      type: 'Tabs',
      fullWidth: props.fullWidth || false,
      children
    })
  },

  Tab: {
    tag: 'mdc-tab',
    props: ['selected', 'disabled'],
    events: ['click'],
    render: (props, children) => ({
      type: 'Tab',
      selected: props.selected || false,
      children
    })
  },

  // Dialog
  Dialog: {
    tag: 'mdc-dialog',
    props: ['open', 'scrimClickAction', 'escapeKeyAction'],
    events: ['open', 'close', 'cancel'],
    render: (props, children) => ({
      type: 'Dialog',
      open: props.open || false,
      children
    })
  },

  // Snackbar
  Snackbar: {
    tag: 'mdc-snackbar',
    props: ['open', 'timeoutMs'],
    events: ['open', 'close'],
    render: (props) => ({
      type: 'Snackbar',
      open: props.open || false
    })
  },

  // Menu
  Menu: {
    tag: 'mdc-menu',
    props: ['open'],
    events: ['select'],
    render: (props, children) => ({
      type: 'Menu',
      open: props.open || false,
      children
    })
  },

  // List
  List: {
    tag: 'mdc-list',
    props: ['dense', 'outlined', 'noninteractive'],
    events: ['select'],
    render: (props, children) => ({
      type: 'List',
      dense: props.dense || false,
      children
    })
  },

  ListItem: {
    tag: 'mdc-list-item',
    props: ['selected', 'disabled', 'twoLine', 'threeLine', 'graphic'],
    events: ['click'],
    render: (props, children) => ({
      type: 'ListItem',
      selected: props.selected || false,
      children
    })
  },

  // Progress
  LinearProgress: {
    tag: 'mdc-linear-progress',
    props: ['buffer', 'chunk', 'closed', 'indeterminate', 'reverse', 'stream'],
    events: [],
    render: (props) => ({
      type: 'LinearProgress',
      indeterminate: props.indeterminate || false
    })
  },

  CircularProgress: {
    tag: 'mdc-circular-progress',
    props: ['indeterminate', 'buffer', 'chunk', 'closed', 'reverse', 'value'],
    events: [],
    render: (props) => ({
      type: 'CircularProgress',
      indeterminate: props.indeterminate || false
    })
  },

  // Checkbox & Radio
  Checkbox: {
    tag: 'mdc-checkbox',
    props: ['checked', 'indeterminate', 'disabled', 'required'],
    events: ['change'],
    render: (props) => ({
      type: 'Checkbox',
      checked: props.checked || false,
      disabled: props.disabled || false
    })
  },

  Radio: {
    tag: 'mdc-radio',
    props: ['checked', 'disabled', 'required'],
    events: ['change'],
    render: (props) => ({
      type: 'Radio',
      checked: props.checked || false,
      disabled: props.disabled || false
    })
  },

  // Slider
  Slider: {
    tag: 'mdc-slider',
    props: ['disabled', 'max', 'min', 'step', 'value', 'tickMarks'],
    events: ['input', 'change'],
    render: (props) => ({
      type: 'Slider',
      min: props.min || 0,
      max: props.max || 100,
      value: props.value || 0
    })
  },

  // Select
  Select: {
    tag: 'mdc-select',
    props: ['disabled', 'required', 'value'],
    events: ['change'],
    render: (props, children) => ({
      type: 'Select',
      label: props.label || '',
      disabled: props.disabled || false,
      children
    })
  },

  // Top App Bar
  TopAppBar: {
    tag: 'mdc-top-app-bar',
    props: ['fixed', 'dense', 'short', 'shortCollapsed', 'title'],
    events: [],
    render: (props, children) => ({
      type: 'TopAppBar',
      title: props.title || '',
      children
    })
  },

  // Drawer
  Drawer: {
    tag: 'mdc-drawer',
    props: ['open', 'modal', 'temporary'],
    events: [],
    render: (props, children) => ({
      type: 'Drawer',
      open: props.open || false,
      children
    })
  },

  // Tooltip
  Tooltip: {
    tag: 'mdc-tooltip',
    props: ['open', 'anchored', 'wrapping'],
    events: [],
    render: (props, children) => ({
      type: 'Tooltip',
      text: props.text || '',
      children
    })
  },

  // Link
  Link: {
    tag: 'mdc-link',
    props: ['disabled', 'href', 'target'],
    events: ['click'],
    render: (props, children) => ({
      type: 'Link',
      href: props.href || '#',
      children
    })
  },

  // Icon Button
  IconButton: {
    tag: 'mdc-icon-button',
    props: ['disabled', 'icon', 'tooltip'],
    events: ['click'],
    render: (props) => ({
      type: 'IconButton',
      icon: props.icon || 'default',
      disabled: props.disabled || false
    })
  }
};

// Generate Material Web component definitions
function generateComponentDefinitions() {
  const definitions = [];
  
  for (const [name, config] of Object.entries(COMPONENTS)) {
    definitions.push({
      name,
      tag: config.tag,
      props: config.props,
      events: config.events,
      css: generateComponentCSS(name, config.tag)
    });
  }
  
  return definitions;
}

function generateComponentCSS(name, tag) {
  return `
/* ${name} Component Styles */
${tag} {
  --mdc-theme-primary: var(--stingray-primary, #0066cc);
  --mdc-theme-on-primary: var(--stingray-onPrimary, #ffffff);
  --mdc-shape-medium: var(--stingray-shape-medium, 12px);
  --mdc-shape-large: var(--stingray-shape-large, 16px);
  --mdc-shape-small: var(--stingray-shape-small, 8px);
  font-family: system-ui, -apple-system, sans-serif;
}

${tag}[raised] {
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

${tag}[outlined] {
  border: 1px solid var(--mdc-theme-outline, #757575);
}
  `.trim();
}

// Theme configuration
const THEMES = {
  default: {
    primary: '#0066cc',
    secondary: '#ff6b35',
    surface: '#ffffff',
    background: '#f5f5f5',
    error: '#b00020',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onSurface: '#000000',
    onBackground: '#000000',
    onError: '#ffffff',
    textPrimary: '#000000',
    textSecondary: '#666666',
    shapeSmall: '8px',
    shapeMedium: '12px',
    shapeLarge: '16px',
    elevation1: '0 1px 3px rgba(0,0,0,0.12)',
    elevation2: '0 2px 4px rgba(0,0,0,0.15)',
    elevation3: '0 4px 8px rgba(0,0,0,0.18)'
  },
  dark: {
    primary: '#90caf9',
    secondary: '#ff8a65',
    surface: '#1e1e1e',
    background: '#121212',
    error: '#f28b82',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#ffffff',
    onBackground: '#ffffff',
    onError: '#000000',
    textPrimary: '#ffffff',
    textSecondary: '#aaaaaa'
  },
  light: {
    primary: '#1976d2',
    secondary: '#dc004e',
    surface: '#fafafa',
    background: '#ffffff',
    error: '#b00020',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#000000',
    onBackground: '#000000',
    onError: '#ffffff'
  }
};

module.exports = { COMPONENTS, generateComponentDefinitions, generateComponentCSS, THEMES };
