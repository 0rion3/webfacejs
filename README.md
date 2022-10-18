Webface.js
----------

Documentation/Reference: [https://webfacejs.net](webfacejs.net)

Adding Webface.js to a new site:

    <script src="path/to/webface/lib/webface_init.js"></script>
    <script src="webface_app.js" type="module"></script> // Notice type="module" here, it's required.

The second file should be created by you and contain the following code:

    import { Webface } from "path/to/webface/lib/webface.js"
    Webface.init();

This will load everything. However, if you don't want to load all components provided by Webface, simply
copy the contents of `path/to/webface/lib/webface.js` file in place of the `import` directive and remove
the components you don't want. However, don't forget to change the import paths because they're relative.

Adding your own components or any other js files is simple, just add them after the first `import` directive:

    import { Webface     } from "path/to/webface/lib/webface.js"
    import { MyComponent } from "my_component.js"
    Webface.init();
