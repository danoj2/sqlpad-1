/*

"component" for chart editor

EXAMPLE: 

var ChartEditor = require('this-file.js');
var chartEditor = new ChartEditor();





*/

var $ = require('jquery');
var d3 = require('d3');
var nv = require('nv');

var ChartEditor = function (opts) {
    var me = this;
    var sqlEditor = opts.sqlEditor;
    var gchart;
    var gdata;
    var gmeta;
    var chartTypes = {}; // holds chart types once registered
    var $chartTypeDropDown = $('#chart-type-dropdown');
    var $btnVisualize = $('#btn-visualize');
    var $chartSetupUI = $("#chart-setup-ui");
    
    this.registerChartType = function (type, chartType) {
        chartTypes[type] = chartType;
        $chartTypeDropDown.append('<option value="' + type + '">' + type + '</option>');
    };
    
    this.buildChartUI = function () {
        gmeta = sqlEditor.getGmeta();
        var selectedChartType = $chartTypeDropDown.val();
        // loop through and create dropdowns
        if (chartTypes[selectedChartType]) {
            $chartSetupUI.empty();
            var ct = chartTypes[selectedChartType];
            for (var f in ct.fields) {
                var field = ct.fields[f];
                var $formGroup = $('<div class="form-group">');
                var $label = $('<label class="control-label">' + field.label + '</label>');
                var $input;
                if (field.inputType === "field-dropdown") {
                    $input = $('<select>');
                    $input.append('<option value=""></option>');
                    for (var m in gmeta) {
                        $input.append('<option value="' + m + '">' + m + '</option>');
                    }
                }
                $formGroup
                    .append($label)
                    .append($input)
                    .appendTo($chartSetupUI);
                // add a reference to input for later  
                field.$input = $input;
            }
        }
    };
    
    this.getChartConfiguration = function () {
        /*
            {
                chartType: "line",
                fields: {
                    "x": "column-name",
                    "y": "column-name"
                }
            }
        */
        var chartConfig = {
            chartType: null,
            fields: {}
        };
        chartConfig.chartType = $chartTypeDropDown.val();
        if (chartTypes[chartConfig.chartType]) {
            var ct = chartTypes[chartConfig.chartType];
            for (var f in ct.fields) {
                chartConfig.fields[f] = ct.fields[f].$input.val();
            }
        }
        return chartConfig;
    };
    
    this.loadChartConfiguration = function (config) {
        // set chart type dropdown
        // fire .buildChartUI
        // loop through chart types and set their values
        $chartTypeDropDown.val(config.chartType);
        $chartTypeDropDown.trigger("change");
        if (chartTypes[config.chartType]) {
            var ct = chartTypes[config.chartType];
            for (var f in ct.fields) {
                if (config.fields[f]) {
                    // attempt to set the value of what is in the config
                    ct.fields[f].$input.val(config.fields[f]);
                    // check the value
                    var inputVal = ct.fields[f].$input.val();
                t    // if the value is nothing, then we will force it
                    if (!inputVal) {
                        console.log('in the thing');
                        console.log(ct.fields[f]);
                        console.log(config.fields[f]);
                        ct.fields[f].$input.append('<option value="' + config.fields[f] + '">' + config.fields[f] + '</option>');
                        ct.fields[f].$input.val(config.fields[f]);
                    }
                }
            }
        }
    };
    
    this.rerenderChart = function () {
        var chartConfig = me.getChartConfiguration();
        me.buildChartUI();
        me.loadChartConfiguration(chartConfig);
        me.renderChart();
    };
    
    // TODO: factor out the chart piece from the chart editor
    this.renderChart = function () {
        gdata = sqlEditor.getGdata();
        gmeta = sqlEditor.getGmeta();
        
        var selectedChartType = $chartTypeDropDown.val();
        if (chartTypes[selectedChartType]) {
            var ct = chartTypes[selectedChartType];
            // loop through chart type fields and do things like
            // add the value, datatype
            for (var f in ct.fields) {
                var field = ct.fields[f];
                field.val = field.$input.val();
                if (field.val && gmeta[field.val]) {
                    field.datatype = gmeta[field.val].datatype;
                    field.min = gmeta[field.val].min;
                    field.max = gmeta[field.val].max;
                }
            }
            var cData = ct.transformData(gmeta, gdata, ct.fields);
            var chart = ct.renderChart(gmeta, gdata, ct.fields);
            gchart = chart;
            $('#chart svg').empty();
            d3.select('#chart svg')
                .datum(cData)
                .call(chart);
            nv.addGraph(function () {
                return chart;
            });
        }
    };
    
    // Bind Events
    $btnVisualize.click(me.renderChart);
    $chartTypeDropDown.change(me.buildChartUI);
    $(window).resize(function () {
        if (gchart) gchart.update();
    });
};
module.exports = ChartEditor;
