# Modules: Developer Quickstart Template
[@aarontburn](https://github.com/aarontburn)  
Module template for [Modules](https://github.com/aarontburn/modules)

# Template Installation
To start, clone the template and do 
```
npm install
```
to install any required packages.

# Getting Started
![image](https://github.com/aarontburn/modules-module-quickstart/assets/103211131/1599588a-2ef2-44fd-a828-1e922de6dc99)

This is what the initial template should look like. All assets related to your module should remain within the `developer.Sample_Module` directory.

Do not modify the contents of `module_builder` or any other files, as those changes will not be saved when used in the main application.

## Renaming everything
Create a module ID and module name.
: A normalized way to create a module ID would `{companyName}.{Module_Name}`. Avoid whitespace and special characters, besides `_` for spaces.
> As an example, let's say our company name is `aarontburn` and our we are creating a system volume controller.
>> Module Name: Volume Controller  
>> Module ID: aarontburn.Volume_Controller

To be safe, rename all `{ModuleName}`s to the same thing.
1. Rename the `developer.Sample_Module` directory to your module ID.
> Directory: `developer.Sample_Module` → `aarontburn.Volume_Controller`  

2. Rename `{ModuleName}.css` to a suitable name.
> `{ModuleName}.css` → `VolumeController.css`

3. Rename `{ModuleName}Renderer.ts` to a suitable name.  
\* This file **MUST** end with `Renderer.ts`
> `{ModuleName}Renderer.ts` → `VolumeControllerRenderer.ts`

4. Rename `{ModuleName}Process.ts` to a suitable name.  
\* This file **MUST** end with `Process.ts`
> `{ModuleName}Process.ts` → `VolumeControllerProcess.ts`
5. Rename `{ModuleName}HTML.html` to a proper name.
> `{ModuleName}HTML.html` → `VolumeControllerHTML.html`
6. In `{ModuleName}HTML.html`, modify the CSS `<link>`  `href`'s location to the name of your CSS file (in step 2).
	```
	<!-- Modify this for the name to the name of your CSS file. -->
	<link rel="stylesheet" href="./{MODULE_NAME}.css">
	```
	
	>  ```
	>	<!-- Modify this for the name to the name of your CSS file. -->
	>	<link rel="stylesheet" href="./VolumeController.css">
	>	```
7. In `{ModuleName}HTML.html`, modify the `<script>`'s `src` to point towards your renderer.
	> It's not DIRECTLY pointing to your renderer, but it will after compilation.
		
	```
	<!-- Note: This script tag NEEDS to stay a single line. -->
	<!-- @renderer -->
	<script defer src="./{MODULE_NAME}Renderer.js"></script>
	```
	
	> ```
	> <!-- Note: This script tag NEEDS to stay a single line. -->
	> <!-- @renderer -->
	> <script defer src="./VolumeControllerRenderer.js"></script>
	> ```
9. In `{ModuleName}Process.ts`, modify the `MODULE_NAME`, `MODULE_ID`, and `HTML_PATH` variables. Rename the class declaration to the name of the file. 
	```
	// {ModuleName}Process.ts
	...
	export class SampleModuleProcess extends Process {
		private static readonly MODULE_NAME: string = "Sample Module";
		private static readonly MODULE_ID: string = "developer.Sample_Module";
		private static readonly HTML_PATH: string = path.join(__dirname, "./{ModuleName}HTML.html");
	...
	```
	> ```
	> // VolumeControllerProcess.ts
	> ...
	> export class VolumeControllerProcess extends Process {
	> 	private static readonly MODULE_NAME: string = "Volume Controller";
	> 	private static readonly MODULE_ID: string = "aarontburn.Volume_Controller";
	> 	private static readonly HTML_PATH: string = path.join(__dirname, "./VolumeControllerHTML.html");
	> ...
	> ```
	
10. In `{ModuleName}Renderer.ts`, modify `MODULE_ID`.
	```
	// {ModuleName}Renderer.ts
	...
	const MODULE_ID: string = "developer.Sample_Module";
	...
	```
	> ```
	> // VolumeControllerRenderer.ts
	>...
	> const MODULE_ID: string = "aarontburn.Volume_Controller";
	> ...
	> ```
	

## Running the application
After modifying the files, you should be ready to start developing your module. 

In the terminal, run the command:
```
npm start
```

If no exceptions are thrown in the console, you have correctly installed and renamed things.


# Developing your Module
## Understanding Electron
As this platform is utilizes Electron, you must abide by some of their design principles, the main one being context-isolation and IPC. 

For safety reasons, Electron uses context-isolation to isolate the process and renderer. The process has full access to Node.js packages, but no access to the DOM. The renderer is the opposite; is no access to Node.js packages but full access to the DOM. This also means that you are unable to use `import` or `require` in the renderer.

In order to communicate between them, Electron offers [Inter-Process Communication (IPC)](https://www.electronjs.org/docs/latest/tutorial/ipc). It is important to understand what you can send, but the process to send and receive information has been streamlined in the code.

## Module Structure
Each module consists of a:
- **Process**: The "main" of your module. This is also the object that is directly connected to the platform.
- **Renderer**: The frontend of your module. In an isolated context and only handles DOM manipulation.
- **HTML**: The structure of your frontend.
- **CSS**: Styling for the HTML.


## Process Structure
The process file is the backend of your module. It has full access to Node packages. It does not have direct access to the frontend - you will need to communicate and send data to the frontend and do the updating there.

All `console.log()` will output to the terminal.

### Important Functions

#### Constructor
The only thing the constructor needs is the call to `super()`. Do not add logic that is important to your module here; treat the `initialize()` function as the main entry point.

#### initialize()
The entry point of your module. This function is called once the renderer is ready sends back an `init` signal.

#### handleEvent(eventType: string, data: any[])
This function is responsible for dealing with information sent from the renderer.

**eventType**: *string* → The name of the event. Use a switch-case or if-statement to distinguish between events.  

**data**: *any[]* → Any data sent from the renderer. If no data is sent, will be an empty array.

#### sendToRenderer(eventType: string, ...data: any[])
This function is responsible for sending information to the renderer.

**eventType**: *string* → The name of the event.
**data**: *any[]* → Any data to be sent. See Electrons [Object Serialization](https://www.electronjs.org/docs/latest/tutorial/ipc#object-serialization) to verify if your data can be properly sent.

For more details about the process functions, see the [Process guide](https://github.com/aarontburn/modules-module-quickstart/blob/main/docs/Process.md).
	
## Renderer Structure 
The renderer file is the frontend of your module. It has **NO ACCESS** to Node packages, including `require` or `import`. To deal with scoping, the entire renderer is encased in an anonymous function. 

It does have access to the DOM. You should send data from the process, receive it in the renderer, and use that information to update the frontend. 

All `console.log()` will output to the developer console.

#### sendToProcess(eventType: string, ...data: any[]): Promise\<any>
This pre-defined function is the method of sending information back to the process. 

**eventType**: *string* → The name of the event.
**data**: *any[]* → Any data to send back to the process. See Electrons [Object Serialization](https://www.electronjs.org/docs/latest/tutorial/ipc#object-serialization) to verify if your data can be properly sent.


For more details about the renderer, see the Renderer guide. // Add link here

# moduleinfo.json
Bundled with your module should be a file named `moduleinfo.json` which contains information about your module. This information will be displayed in the Settings module.

![image](https://github.com/aarontburn/modules-module-quickstart/assets/103211131/37b22e3a-3efe-443e-a2df-c72b25af89cd)

```
// moduleinfo.json
{
	"module_name": "Sample Module",
	"author": "Developer Name",
	"version": "1.0.0",
	"description": "A sample module to quickly start developing modules.",
	"build_version": 1,
	"platforms": [],
	"link": "https://github.com/aarontburn/modules-module-quickstart"
}
```
Many fields are self-explanatory.

**build_version** → An internal counter that will not be displayed. This number is incremented each time your module is exported using `npm run export` so that the platform knows to recompile your module.

**platforms** → An array of platforms that your module is compatible with. Currently, this has no meaning, but this may be used at a future version.

If the `developer mode` option is not checked, it will only display the name, author, description, and link. If the option IS checked, it will display everything in the `moduleinfo.json`, even if the keys are invalid.


# Exporting your Module
After you finish developing your module, you will need to export it to distribute it. 

In the terminal, run the command:
```
npm run export
```
This will open a file dialog where you can choose the location to export your module. 

Assuming you followed the provided naming scheme, your module will be exported as `<moduleID>.zip` (for example, the Volume Controller is exported as `aarontburn.Volume_Controller.zip`)

That's it! Your module is exported. If you utilized any dependencies, they will automatically be bundled into your exported module inside the `node_modules` folder, including all parent dependencies. You can now distribute this archive file.
