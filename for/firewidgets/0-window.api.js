
exports.forLib = function (LIB) {

    const CONTAINER = require("../../../../lib/firewidgets-for-zerosystem/window.container");

    var exports = {};

    exports.spin = function (context) {
    
        var FireWidgetsContainer = function () {
            var self = this;

            context.on("changed:domNode", function (domNode) {
                
                function scanForComponents () {
                    var components = {};
                    $('[data-component-id]', domNode).each(function () {
            			var componentElement = $(this);
            			var componentId = componentElement.attr("data-component-id");
            			components[componentId] = {
            			    id: componentId,
            			    impl: componentElement.attr("data-component-impl") || "",
            			    container: context,
            			    domNode: componentElement
            			};
            			// HACK: This should be fixed on server.
            			if (components[componentId].impl === "null") {
            			    components[componentId].impl = "";
            			}
            		});
            		return components;
                }

                context.setComponents(scanForComponents());
            });
        }

        return new FireWidgetsContainer(context);
    }

    return exports;
}
