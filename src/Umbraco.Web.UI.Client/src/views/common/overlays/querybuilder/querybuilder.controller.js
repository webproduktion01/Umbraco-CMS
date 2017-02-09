(function () {
    "use strict";

    function QueryBuilderOverlayController($scope, templateQueryResource, localizationService) {

        var everything = localizationService.localize("template_allContent");
        var myWebsite = localizationService.localize("template_websiteRoot");

        var ascendingTranslation = localizationService.localize("template_ascending");
        var descendingTranslation = localizationService.localize("template_descending");
    
        var vm = this;

        vm.properties = [];
        vm.contentTypes = [];
        vm.conditions = [];

        vm.datePickerConfig = {
            pickDate: true,
            pickTime: false,
            format: "YYYY-MM-DD"
        };

        vm.query = {
            contentType: {
                name: everything
            },
            source: {
                name: myWebsite
            },
            filters: [
                {
                    property: undefined,
                    operator: undefined
                }
            ],
            sort: {
                property: {
                    alias: "",
                    name: "",
                },
                direction: "ascending", //This is the value for sorting sent to server
                translation: {
                    currentLabel: ascendingTranslation, //This is the localized UI value in the the dialog
                    ascending: ascendingTranslation,
                    descending: descendingTranslation
                }

            }
        };

        vm.chooseSource = chooseSource;
        vm.getPropertyOperators = getPropertyOperators;
        vm.addFilter = addFilter;
        vm.trashFilter = trashFilter;
        vm.changeSortOrder = changeSortOrder;
        vm.setSortProperty = setSortProperty;
        vm.setContentType = setContentType;
        vm.setFilterProperty = setFilterProperty;
        vm.setFilterTerm = setFilterTerm;
        vm.changeConstraintValue = changeConstraintValue;
        vm.datePickerChange = datePickerChange;

        function onInit() {

            templateQueryResource.getAllowedProperties()
                .then(function (properties) {
                    vm.properties = properties;
                });

            templateQueryResource.getContentTypes()
                .then(function (contentTypes) {
                    vm.contentTypes = contentTypes;
                });

            templateQueryResource.getFilterConditions()
                .then(function (conditions) {
                    vm.conditions = conditions;
                });
                
            throttledFunc();

        }

        function chooseSource(query) {
            vm.contentPickerOverlay = {
                view: "contentpicker",
                show: true,
                submit: function(model) {

                    var selectedNodeId = model.selection[0].id;
                    var selectedNodeName = model.selection[0].name;

                    if (selectedNodeId > 0) {
                        query.source = { id: selectedNodeId, name: selectedNodeName };
                    } else {
                        query.source.name = myWebsite;
                        delete query.source.id;
                    }

                    throttledFunc();

                    vm.contentPickerOverlay.show = false;
                    vm.contentPickerOverlay = null;
                },
                close: function(oldModel) {
                    vm.contentPickerOverlay.show = false;
                    vm.contentPickerOverlay = null;
                }
            };
        }

        function getPropertyOperators(property) {
            var conditions = _.filter(vm.conditions, function (condition) {
                var index = condition.appliesTo.indexOf(property.type);
                return index >= 0;
            });
            return conditions;
        }

        function addFilter(query) {
            query.filters.push({});
        }

        function trashFilter(query) {
            query.filters.splice(query, 1);

            //if we remove the last one, add a new one to generate ui for it.
            if (query.filters.length == 0) {
                query.filters.push({});
            }

        }

        function changeSortOrder(query) {
            if (query.sort.direction === "ascending") {
                query.sort.direction = "descending";
                query.sort.translation.currentLabel = query.sort.translation.descending;
            } else {
                query.sort.direction = "ascending";
                query.sort.translation.currentLabel = query.sort.translation.ascending;
            }
            throttledFunc();
        }

        function setSortProperty(query, property) {
            query.sort.property = property;
            if (property.type === "datetime") {
                query.sort.direction = "descending";
                query.sort.translation.currentLabel = query.sort.translation.descending;
            } else {
                query.sort.direction = "ascending";
                query.sort.translation.currentLabel = query.sort.translation.ascending;
            }
            throttledFunc();
        }

        function setContentType(contentType) {
            vm.query.contentType = contentType;
            throttledFunc();
        }

        function setFilterProperty(filter, property) {
            filter.property = property;
            filter.term = {};
            filter.constraintValue = "";
        }

        function setFilterTerm(filter, term) {
            filter.term = term;
            if(filter.constraintValue) {
                throttledFunc();
            }
        }

        function changeConstraintValue() {
            throttledFunc();
        }

        function datePickerChange(event, filter) {
            if(event.date && event.date.isValid()) {
                filter.constraintValue = event.date.format(vm.datePickerConfig.format);
                throttledFunc();
            }
        }

        var throttledFunc = _.throttle(function () {
            
            templateQueryResource.postTemplateQuery(vm.query)
                .then(function (response) {
                    $scope.model.result = response;
                });

        }, 200);

        onInit();
    }

    angular.module("umbraco").controller("Umbraco.Overlays.QueryBuilderController", QueryBuilderOverlayController);

})();