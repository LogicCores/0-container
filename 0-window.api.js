
exports.forLib = function (LIB) {

    var exports = {};

    // TODO: Load adapters as needed on demand

    exports.adapters = {
        firewidgets: require("./for/firewidgets/0-window.api").forLib(LIB)
    }

    exports.forContexts = function (contexts) {

        var exports = {};

        var Context = exports.Context = function (defaults) {
            var self = this;

            var state = {
                domNode: null,
                components: null
            };
            LIB._.merge(state, LIB._.cloneDeep(defaults));

            self.setDomNode = function (domNode) {
                if (state.domNode !== domNode) {
                    state.domNode = domNode;
                    self.emit("changed:domNode", domNode);
                }
            }

            self.getDomNode = function () {
                return state.domNode;
            }

            self.setComponents = function (components) {
                state.components = components;
                self.emit("changed:components", components);
            }

            self.destroy = function () {
                self.emit("destroy");
                // TODO: Call generic reset for context.
                state.domNode = null;
                state.components = null;
            }
        }
        Context.prototype = Object.create(LIB.EventEmitter.prototype);
        Context.prototype.contexts = contexts;

        return exports;
    }

    return exports;
}

