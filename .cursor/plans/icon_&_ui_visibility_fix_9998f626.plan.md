---
name: Icon & UI Visibility Fix
overview: Standardize all icons to react-icons/fi (Feather), improve visibility with larger sizes and better contrast, add accessibility features, and remove heroicons dependency. This plan provides a comprehensive, component-by-component implementation guide with specific code changes.
todos:
  - id: create-icon-constants
    content: Create src/constants/iconSizes.js with standard icon sizes, colors, and focus utilities
    status: pending
  - id: fix-chatwindow
    content: Replace inline SVG icons in ChatWindow.jsx with FiRefreshCw and FiSend, add focus states
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-navbar
    content: Replace heroicons in Navbar.jsx with react-icons/fi equivalents (FiMenu, FiX, FiChevronDown)
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-footer
    content: Replace heroicons in Footer.jsx with react-icons/fi equivalents (FiMail, FiPhone, FiMapPin)
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-sidebar
    content: Increase icon sizes in Sidebar.jsx, remove opacity-0 from delete button, add focus states
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-userprofile
    content: Increase icon sizes in UserProfile.jsx, add social platform icons, improve contrast
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-editprofile
    content: Standardize icon sizes in EditProfile.jsx to 24px
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-documentuploader
    content: Increase icon sizes in DocumentUploader.jsx and add focus states
    status: pending
    dependencies:
      - create-icon-constants
  - id: fix-chatcontainer
    content: Add focus states to mobile toggle button in ChatContainer.jsx
    status: pending
    dependencies:
      - create-icon-constants
  - id: remove-heroicons
    content: Remove @heroicons/react dependency from package.json after all migrations complete
    status: pending
    dependencies:
      - fix-navbar
      - fix-footer
  - id: test-visual
    content: Test visual consistency, contrast, and icon visibility across all components
    status: pending
    dependencies:
      - fix-chatwindow
      - fix-navbar
      - fix-footer
      - fix-sidebar
      - fix-userprofile
      - fix-editprofile
      - fix-documentuploader
      - fix-chatcontainer
  - id: test-accessibility
    content: Test keyboard navigation, focus states, and screen reader compatibility
    status: pending
    dependencies:
      - test-visual
---

# Icon

& UI Visibility Fix Plan

## Overview

This plan standardizes icon usage across the application, improves visibility and accessibility, and removes the heroicons dependency. All icons will use `react-icons/fi` (Feather icons) for consistency.

## Current State Analysis

### Icon Libraries in Use

- **react-icons/fi** (Feather): Used in UserProfile, Sidebar, EditProfile, DocumentUploader, ChatContainer
- **@heroicons/react**: Used in Navbar (MenuIcon, XIcon, ChevronDownIcon) and Footer (MailIcon, PhoneIcon, LocationMarkerIcon)
- **Inline SVG**: Used in ChatWindow (refresh and send icons)

### Issues Identified

1. **Inconsistent icon sizes**: 16px, 20px, h-4, h-5, h-6 throughout
2. **Poor contrast**: teal-600, gray-400 on light glass backgrounds
3. **Accessibility gaps**: Missing focus states, opacity-0 on delete buttons
4. **Mixed icon libraries**: Makes maintenance difficult

## Implementation Strategy

### Phase 1: Create Icon Constants & Utilities

**File**: `src/constants/iconSizes.js`Create a centralized constants file for icon sizes and colors:

```javascript
// Standard icon sizes
export const ICON_SIZES = {
  xs: 16,   // Extra small (rarely used)
  sm: 20,   // Small buttons, inline text
  md: 24,   // Medium (default for most UI)
  lg: 28,   // Large headers, emphasis
  xl: 32,   // Extra large (rarely used)
};

// Icon color tokens for different contexts
export const ICON_COLORS = {
  // Primary actions
  primary: 'text-teal-700',
  primaryHover: 'hover:text-teal-800',
  primaryOnBg: 'text-white',
  
  // Secondary actions
  secondary: 'text-gray-700',
  secondaryHover: 'hover:text-gray-800',
  
  // Danger actions
  danger: 'text-red-600',
  dangerHover: 'hover:text-red-700',
  
  // Muted/disabled
  muted: 'text-gray-500',
  disabled: 'text-gray-400',
};

// Focus ring utilities
export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2';
```



### Phase 2: Component Updates

#### 2.1 ChatWindow.jsx

**Lines to modify**: 88-108 (refresh button), 199-222 (send button)**Changes**:

- Replace inline SVG refresh icon (lines 93-107) with `<FiRefreshCw size={24} className="text-teal-700" />`
- Replace inline SVG send icon (lines 207-221) with `<FiSend size={24} className="text-white" />`
- Add focus states to both buttons
- Increase refresh button size and add subtle background circle
- Update send button icon to be more visible

**Specific replacements**:

```javascript
// Refresh button (line 88-108)
<button
  onClick={loadMessages}
  className="p-2 rounded-full bg-white/50 hover:bg-white/70 text-teal-700 hover:text-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
  aria-label="Refresh messages"
>
  <FiRefreshCw size={24} aria-hidden="true" />
</button>

// Send button icon (line 207-221)
<FiSend size={24} className="text-white" aria-hidden="true" />
```



#### 2.2 Sidebar.jsx

**Lines to modify**: 35-58 (header buttons), 108-117 (delete button)**Changes**:

- Increase header button icons from 20px to 24px
- Remove opacity-0 from delete button, make it always visible with gray-500
- Add focus states to all icon buttons
- Increase delete icon size from 16px to 20px

**Specific replacements**:

```javascript
// Header buttons (lines 35-58)
<FiPlus size={24} aria-hidden="true" />
<FiUpload size={24} aria-hidden="true" />
<FiRefreshCw size={24} className={loading ? 'animate-spin' : ''} aria-hidden="true" />

// Delete button (lines 108-117)
<button
  onClick={(e) => {
    e.stopPropagation();
    onDeleteConversation(conv.conversation_id);
  }}
  className="p-1.5 text-gray-500 hover:text-red-600 transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
  aria-label="Delete conversation"
>
  <FiTrash2 size={20} aria-hidden="true" />
</button>
```



#### 2.3 UserProfile.jsx

**Lines to modify**: 82-107 (header icons), 107-111 (section headers), 116-124 (InfoCard), 130-150 (social links)**Changes**:

- Increase all icons from 20px to 24px
- Change icon colors from teal-600 to teal-700 for better contrast
- Add platform icons to social links (FiTwitter, FiLinkedin, FiGithub)
- Update InfoCard icons to 24px with darker color
- Add focus states to action buttons

**Specific replacements**:

```javascript
// Verified badge icon (line 82)
<FiCheckCircle className="h-6 w-6 text-white" />

// Email icon in header (line 90)
<FiMail className="mr-2 h-6 w-6" />

// Badge icons (lines 94, 97)
<FiUser className="mr-1 h-6 w-6" />
<FiCalendar className="mr-1 h-6 w-6" />

// Section header icons (lines 107, 130)
<FiUser className="mr-2 h-6 w-6 text-teal-700" />
<FiGlobe className="mr-2 h-6 w-6 text-teal-700" />

// Social links (lines 134-146) - Add icons
{Object.entries(profile.socialLinks).map(([platform, url]) => {
  const IconMap = {
    twitter: FiTwitter,
    linkedin: FiLinkedin,
    github: FiGithub,
  };
  const Icon = IconMap[platform.toLowerCase()] || FiGlobe;
  return url ? (
    <a
      key={platform}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 backdrop-blur-md bg-white/50 hover:bg-white/70 border border-white/30 rounded-lg text-gray-800 text-sm transition-all hover:scale-105 shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      <Icon size={20} className="text-teal-700" />
      <span>{platform}</span>
    </a>
  ) : null;
})}

// InfoCard component (lines 184-197)
const InfoCard = ({ icon, label, value, badgeColor }) => (
  <Card variant="glass" className="hover:shadow-xl transition-all hover:scale-105">
    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
      <span className="text-teal-700">{React.cloneElement(icon, { size: 24 })}</span>
      <span className="ml-2">{label}</span>
    </h3>
    {/* ... rest of component */}
  </Card>
);
```



#### 2.4 Navbar.jsx

**Lines to modify**: 3 (imports), 128 (ChevronDownIcon), 161 (MenuIcon/XIcon)**Changes**:

- Replace all heroicons imports with react-icons/fi equivalents
- MenuIcon → FiMenu
- XIcon → FiX
- ChevronDownIcon → FiChevronDown
- Increase icon sizes to 24px
- Add focus states

**Specific replacements**:

```javascript
// Import (line 3)
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';

// ChevronDownIcon (line 128)
<FiChevronDown size={20} className="text-gray-700" aria-hidden="true" />

// Menu toggle (line 161)
{isMenuOpen ? <FiX size={24} aria-hidden="true" /> : <FiMenu size={24} aria-hidden="true" />}
```



#### 2.5 Footer.jsx

**Lines to modify**: 3-7 (imports), 67-81 (contact icons)**Changes**:

- Replace heroicons with react-icons/fi equivalents
- MailIcon → FiMail
- PhoneIcon → FiPhone
- LocationMarkerIcon → FiMapPin
- Increase icon sizes from h-4 w-4 (16px) to 20px
- Improve contrast with darker gray

**Specific replacements**:

```javascript
// Import (lines 3-7)
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

// Contact icons (lines 67-81)
<FiMapPin size={20} className="mr-2 text-gray-600" />
<FiMail size={20} className="mr-2 text-gray-600" />
<FiPhone size={20} className="mr-2 text-gray-600" />
```



#### 2.6 EditProfile.jsx

**Lines to modify**: 10 (imports), 131 (FiUser), 139 (FiFileText)**Changes**:

- Increase icon sizes from h-5 w-5 and h-4 w-4 to 24px
- Ensure consistent sizing

**Specific replacements**:

```javascript
// Input icon (line 131)
leftIcon={<FiUser size={24} className="text-teal-700" />}

// Bio label icon (line 139)
<FiFileText size={24} className="mr-1 text-teal-700" />
```



#### 2.7 DocumentUploader.jsx

**Lines to modify**: 3 (imports), 68 (FiX), 95 (FiFile), 128 (FiUpload)**Changes**:

- Increase all icon sizes to 24px
- Improve contrast on close button
- Add focus states

**Specific replacements**:

```javascript
// Close button (line 68)
<FiX size={24} className="text-gray-700 hover:text-gray-900" />

// File icon (line 95)
<FiFile size={24} className="text-teal-700" />

// Upload icon (line 128)
<FiUpload size={24} className={isUploading ? 'animate-bounce' : ''} />
```



#### 2.8 ChatContainer.jsx

**Lines to modify**: 11 (imports), 158 (FiMenu/FiX)**Changes**:

- Icons already using react-icons/fi, but increase size to 24px (already correct)
- Add focus states to mobile toggle button

**Specific replacements**:

```javascript
// Mobile toggle button (line 153-159)
<button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
>
  {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
</button>
```



### Phase 3: Dependency Cleanup

**File**: `package.json`**Changes**:

- Remove `@heroicons/react` from dependencies after all components are migrated
- Verify no other files import from heroicons

**Command to run**:

```bash
npm uninstall @heroicons/react
```



### Phase 4: Accessibility Improvements

**Universal changes across all icon buttons**:

1. Add `aria-label` or `aria-hidden="true"` to all icons
2. Add focus ring utilities: `focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`
3. Ensure keyboard navigation works (all buttons are focusable)
4. Remove `opacity-0` from delete buttons - make them always visible

### Phase 5: Testing & Verification

**Visual Testing Checklist**:

- [ ] All icons are consistently sized (20px, 24px, or 28px)
- [ ] Icon colors have sufficient contrast (teal-700, gray-700 minimum)
- [ ] Focus states are visible on all interactive elements
- [ ] Delete buttons are always visible (no opacity-0)
- [ ] Social links show platform icons
- [ ] Mobile responsiveness maintained

**Accessibility Testing**:

- [ ] Tab navigation works through all icon buttons
- [ ] Focus indicators are visible
- [ ] Screen reader announces button labels correctly
- [ ] Color contrast meets WCAG AA standards

**Functional Testing**:

- [ ] All icon buttons trigger correct actions
- [ ] No console errors after migration
- [ ] Icons render correctly in all browsers
- [ ] No broken imports

## Implementation Order

1. **Create icon constants file** (`src/constants/iconSizes.js`)
2. **Fix ChatWindow** - Replace inline SVG icons
3. **Fix Navbar** - Replace heroicons
4. **Fix Footer** - Replace heroicons
5. **Fix Sidebar** - Improve visibility and accessibility
6. **Fix UserProfile** - Increase sizes, add social icons
7. **Fix EditProfile** - Standardize icon sizes
8. **Fix DocumentUploader** - Improve visibility
9. **Fix ChatContainer** - Add focus states
10. **Remove heroicons dependency** - Clean up package.json
11. **Test thoroughly** - Visual, accessibility, and functional

## Files to Modify

**New Files**:

- `src/constants/iconSizes.js` - Icon size and color constants

**Modified Files**:

- `src/components/Chat/ChatWindow.jsx` - Lines 88-108, 199-222
- `src/components/Chat/Sidebar.jsx` - Lines 35-58, 108-117
- `src/components/Chat/ChatContainer.jsx` - Line 153-159
- `src/components/Chat/DocumentUploader.jsx` - Lines 68, 95, 128
- `src/pages/UserProfile.jsx` - Lines 82-197
- `src/pages/EditProfile.jsx` - Lines 131, 139
- `src/components/Navbar.jsx` - Lines 3, 128, 161
- `src/components/Footer.jsx` - Lines 3-7, 67-81
- `package.json` - Remove @heroicons/react

## Decisions Made

1. **Icon size standards**: 20px (small), 24px (default), 28px (emphasis)
2. **Color standards**: teal-700 for primary, gray-700 for secondary, red-600 for danger
3. **Delete button visibility**: Always visible with gray-500, hover to red-600
4. **Social links**: Show icon + text for better UX
5. **Focus states**: Standard ring-2 with teal-500 on all interactive elements
6. **Icon library**: Standardize on react-icons/fi (Feather) for consistency

## Notes

- All icon sizes are specified in pixels (not Tailwind classes) for consistency
- Focus states use Tailwind's ring utilities for accessibility