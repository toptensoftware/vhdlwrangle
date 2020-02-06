# vhdlwrangle 

VHDL Wrangle is a simple VS Code extension for wrangling with VHDL code.

## Features

VHDL Wrangle can:

* Convert VHDL entity declarations into instances
* Convert VHDL port declarations into signals
* Simple, convention driven Jump to Definition


## Usage

To convert a VHDL entity declaration into a instance:

1. Select the entity declaration (usually you'll copy/paste it from the entity's implementation file and paste it where you want the instance).
2. Invoke the vhdlwrangle.convertEntityDeclToInstance command.  ie: Ctrl+Shift+P -> Convert VHDL Entity Declaration to Instance

eg: Before:

```
entity ClockDivider is
generic
(
    p_period : integer                  -- Period of the clock enable (in clock cycles)
);
port 
( 
    -- Control
    i_clock : in std_logic;             -- Clock
    i_clken : in std_logic;             -- Clock Enable for clock being divided
    i_reset : in std_logic;             -- Reset (synchronous, active high)
    
    -- Output
    o_clken : out std_logic             -- Generated clock enable signal
);
end ClockDivider;
```

After:
```
	e_ClockDivider : entity work.ClockDivider
	generic map
	(
		p_period => p_period
	)
	port map
	(
		i_clock => s_clock,
		i_clken => s_clken,
		i_reset => s_reset,
		o_clken => s_clken
	);
```

To convert a VHDL port declarations to signal declarations:

1. Select the port declarations to be converted (again you'll probably copy/paste these from elsewhere)
2. Invoke the vhdlwrangle.convertPortDeclsToSignals command.  ie: Ctrl+Shift+P -> Convert VHDL Port Declarations to Signals

eg: Before

```
    -- Control
    i_clock : in std_logic;             -- Clock
    i_clken : in std_logic;             -- Clock Enable for clock being divided
    i_reset : in std_logic;             -- Reset (synchronous, active high)
    
    -- Output
    o_clken : out std_logic             -- Generated clock enable signal
```

After:

```
	signal s_clock : std_logic;
	signal s_clken : std_logic;
	signal s_reset : std_logic;
	signal s_clken : std_logic;
```

## Go To Definition

VhdlWrangle includes a simple, configuration free VS Code definition provider.  It relies on a few simple conventions:

1. The source file for an entity is always located in a file with the same name + ".vhd".
2. The source file for an entity is located by searching the same directory as the current source file as well as all
   workspace folders and their sub-folders.

The implementation is deliberately simple, but also limited:

1. Assumes one VHDL entity per file
2. Doesn't support libraries/packages (only uses the entity name)
3. Doesn't support functions or packages



## Known Issues

None known, probably many unknown :)

## Release Notes


### 1.0.0

Initial release!


