# AppleScript Dictionary Documentation for Chromium Browser

## Table of Contents
1. [Introduction](#introduction)
2. [Object Model](#object-model)
3. [Conventions & Notation](#conventions--notation)
4. [Standard Suite Reference](#standard-suite-reference)
5. [Chromium Suite Reference](#chromium-suite-reference)
6. [Examples](#examples)

## Introduction

This documentation describes the AppleScript interface for controlling a Chromium-based browser on macOS. The browser exposes two main scripting suites: the Standard Suite (common to all scriptable applications) and the Chromium Suite (specific to browser functionality).

## Object Model

### Hierarchy Overview

The browser's AppleScript object model follows a hierarchical structure:

```
Application
├── Windows
│   └── Tabs
└── Bookmark Folders
    ├── Bookmark Folders (nested)
    └── Bookmark Items
```

### Key Relationships

- **Application** is the top-level container object
- **Windows** are contained by the application and contain tabs
- **Tabs** represent individual browser tabs within windows
- **Bookmark Folders** can contain other bookmark folders and bookmark items
- **Bookmark Items** represent individual bookmarks with URLs

## Conventions & Notation

### Property Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | String value | "Google Chrome" |
| `boolean` | True/false value | `true`, `false` |
| `integer` | Whole number | `1`, `42` |
| `number` | Numeric value | `3.14`, `100` |
| `rectangle` | Bounding box coordinates | `{0, 0, 800, 600}` |
| `specifier` | Reference to an object | `window 1` |
| `record` | Dictionary of properties | `{name:"Example", visible:true}` |
| `list` | Array of items | `{file1, file2, file3}` |

### Property Attributes

- **r/o** - Read-only property (cannot be modified)
- **[optional]** - Optional parameter in square brackets
- **→** - Return value indicator

## Standard Suite Reference

### Application Class

The application's top-level scripting object that represents the browser itself.

#### Elements
- `windows` - Collection of all browser windows

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `name` | text | r/o | The name of the application |
| `frontmost` | boolean | r/o | Whether this is the currently active application |
| `version` | text | r/o | The version number of the application |

#### Commands

##### open
Opens one or more files.
```applescript
open {file1, file2, ...}
```
- Parameter: `list of file` - The file(s) to be opened

##### print
Prints the specified object.
```applescript
print specifier
```
- Parameter: `specifier` - The file(s) or document(s) to be printed

##### quit
Quits the application.
```applescript
quit
```

### Window Class

Represents a browser window.

#### Elements
- `tabs` - Collection of tabs in the window

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `given name` | text | r/w | The user-assigned name of the window |
| `name` | text | r/o | The full title of the window |
| `id` | text | r/o | Unique identifier of the window |
| `index` | integer | r/w | Position in the window stack (front to back) |
| `bounds` | rectangle | r/w | The window's position and size |
| `closeable` | boolean | r/o | Whether the window has a close button |
| `minimizable` | boolean | r/o | Whether the window can be minimized |
| `minimized` | boolean | r/w | Current minimized state |
| `resizable` | boolean | r/o | Whether the window can be resized |
| `visible` | boolean | r/w | Current visibility state |
| `zoomable` | boolean | r/o | Whether the window can be zoomed |
| `zoomed` | boolean | r/w | Current zoomed state |
| `active tab` | tab | r/o | The currently selected tab |
| `mode` | text | r/w* | Window mode: 'normal' or 'incognito' (*set only at creation) |
| `active tab index` | integer | r/w | Index of the active tab |

#### Commands

##### close
Closes the window.
```applescript
close window 1
```

##### save
Saves the window's content.
```applescript
save window 1 in file "path/to/file" as "complete html"
```
- Parameters:
  - `in file` (optional) - Destination file path
  - `as text` (optional) - Format: 'only html', 'complete html', or 'single file' (default: 'complete html')

### Generic Commands

These commands can be used with various objects:

#### count
Returns the number of elements of a specific class.
```applescript
count windows
count each tab of window 1
```
- Returns: `integer` - The count of elements

#### delete
Deletes an object.
```applescript
delete tab 1 of window 1
```

#### duplicate
Creates a copy of an object.
```applescript
duplicate tab 1 to end of tabs of window 2
```
- Parameters:
  - `to location specifier` (optional) - Destination location
  - `with properties record` (optional) - Properties for the new object
- Returns: `specifier` - Reference to the duplicated object

#### exists
Checks if an object exists.
```applescript
exists window 1
```
- Returns: `boolean` - True if exists, false otherwise

#### make
Creates a new object.
```applescript
make new window with properties {mode:"incognito"}
```
- Parameters:
  - `new type` - Class of object to create
  - `at location specifier` (optional) - Where to insert
  - `with data any` (optional) - Initial content
  - `with properties record` (optional) - Initial property values
- Returns: `specifier` - Reference to the new object

#### move
Moves an object to a new location.
```applescript
move tab 1 to end of tabs of window 2
```
- Parameter: `to location specifier` - The destination
- Returns: `specifier` - Reference to the moved object

## Chromium Suite Reference

### Tab Class

Represents a browser tab within a window.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `id` | text | r/o | Unique identifier of the tab |
| `title` | text | r/o | The title of the page |
| `URL` | text | r/w | The current URL |
| `loading` | boolean | r/o | Whether the tab is currently loading |

#### Commands

##### execute
Executes JavaScript code in the tab.
```applescript
execute tab 1 of window 1 javascript "alert('Hello');"
```
- Parameter: `javascript text` - The JavaScript code to execute
- Returns: `any` - The result of the JavaScript execution

##### reload
Reloads the tab.
```applescript
reload tab 1 of window 1
```

##### stop
Stops the tab from loading.
```applescript
stop tab 1 of window 1
```

##### go back
Navigates back in history.
```applescript
go back tab 1 of window 1
```

##### go forward
Navigates forward in history.
```applescript
go forward tab 1 of window 1
```

##### view source
Shows the HTML source of the page.
```applescript
view source tab 1 of window 1
```

##### Text Manipulation Commands

###### select all
Selects all text in the tab.
```applescript
select all tab 1 of window 1
```

###### cut selection
Cuts selected text.
```applescript
cut selection tab 1 of window 1
```

###### copy selection
Copies selected text.
```applescript
copy selection tab 1 of window 1
```

###### paste selection
Pastes text from clipboard.
```applescript
paste selection tab 1 of window 1
```

###### undo
Undoes the last change.
```applescript
undo tab 1 of window 1
```

###### redo
Redoes the last undone change.
```applescript
redo tab 1 of window 1
```

### Bookmark Folder Class

Represents a folder in the bookmarks hierarchy.

#### Elements
- `bookmark folders` - Nested bookmark folders
- `bookmark items` - Individual bookmarks

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `id` | text | r/o | Unique identifier of the folder |
| `title` | text | r/w | The name of the folder |
| `index` | number | r/o | Position within parent folder |

#### Special Folders

The application provides two special bookmark folders:
- `bookmarks bar` (r/o) - The bookmarks bar folder
- `other bookmarks` (r/o) - The other bookmarks folder

### Bookmark Item Class

Represents an individual bookmark.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `id` | text | r/o | Unique identifier of the bookmark |
| `title` | text | r/w | The name of the bookmark |
| `URL` | text | r/w | The bookmarked URL |
| `index` | number | r/o | Position within parent folder |

## Notes

- Window mode ('normal' or 'incognito') can only be set during window creation
- Some properties are read-only and cannot be modified
- JavaScript execution results depend on the page's security context
- Bookmark operations may require user permission depending on browser settings
- Performance may vary based on the number of open tabs and windows