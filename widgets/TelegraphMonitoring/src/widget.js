/**
 * Created by kinneretzin on 13/09/2017.
 */

import MonitoringGraphs from './MonitoringGraphs';

const NO_DATA = 'noData';

Stage.defineWidget({
    name: "Telegraph monitoring",
    description: '',
    initialWidth: 12,
    initialHeight: 25,
    color: "purple",
    isReact: true,
    hasStyle: true,
    categories: [Stage.GenericConfig.CATEGORY.CHARTS_AND_STATISTICS],
    permission: 'widget-user',

    initialConfiguration: [
        Stage.GenericConfig.POLLING_TIME_CONFIG(60),
        {
            id: 'vmFieldName',
            name: 'vm field name',
            default: 'host',
            placeHolder: 'Enter the vm field name for the influx measurements tables',
            description: 'The vm field name in the influx table',
            type: Stage.Basic.GenericField.STRING_TYPE
        },
        {
            id: 'isManager',
            name: 'should show manager own info',
            default: false,
            //placeHolder: 'Enter the vm field name for the influx measurements tables',
            description: 'Should we show manager information or all other vms information',
            type: Stage.Basic.GenericField.BOOLEAN_TYPE
        }
    ],

    fetchData(widget,toolbox/*,params*/) {
        var vms = [];
        var selectedMeasurement = toolbox.getContext().getValue('selectedMeasurement');
        var selectedVm = toolbox.getContext().getValue('selectedVm');

        if (!selectedMeasurement && !selectedVm) {
            selectedMeasurement = 'mem';
        }

        var timeFilter = toolbox.getContext().getValue('timeFilter');
        let timeStart = _.get(timeFilter, 'start', Stage.Basic.InputTimeFilter.INFLUX_DEFAULT_VALUE.start);
        timeStart = moment(timeStart).isValid() ? `${moment(timeStart).unix()}s` : timeStart;

        let timeEnd = _.get(timeFilter, 'end', Stage.Basic.InputTimeFilter.INFLUX_DEFAULT_VALUE.end);
        timeEnd = moment(timeEnd).isValid() ? `${moment(timeEnd).unix()}s` : timeEnd;

        let timeResolution = _.get(timeFilter, 'resolution', Stage.Basic.InputTimeFilter.INFLUX_DEFAULT_VALUE.resolution);
        let timeUnit = _.get(timeFilter, 'unit', Stage.Basic.InputTimeFilter.INFLUX_DEFAULT_VALUE.unit);
        let timeGroup = `${timeResolution}${timeUnit}`;

        var measurementsList = toolbox.getConfig().monitoringGraphs;
        var vmFieldName = widget.configuration.vmFieldName;
        var isManager = widget.configuration.isManager;

        if (isManager) {
            selectedVm = 'Manager';
            selectedMeasurement = null;
        }

        return toolbox.getInternal().doGet('/monitor/new/showTagValues',
            {
                qFrom : selectedMeasurement || 'mem',
                qWithKey : `=${vmFieldName}`,
                qWhere : `tenant='${toolbox.getManager().getSelectedTenant()}' `
            })
            .then(vmsList=>{

                vms = _.map(vmsList,'value');

                var queries = [];

                if (isManager) {
                    _.each(measurementsList,(measurementData,measurement)=>{

                        var fieldsSelect = _.join(_.map(measurementData.fields,f=>{
                            return `mean(${f}) as ${f}`;
                        }),',');

                        queries.push({
                                qSelect :  fieldsSelect,
                                qFrom : measurement,
                                qWhere: `time > ${timeStart} and
                                        time < ${timeEnd} and tenant='manager'
                                        group by time(${timeGroup})`
                            }
                        )
                    })

                } else if (selectedMeasurement) {
                    var graphsConfig = measurementsList[selectedMeasurement];
                    var fieldsSelect = _.join(_.map(graphsConfig.fields,f=>{
                        return `mean(${f}) as ${f}`;
                    }),',');

                    _.each(vms,vm=>{
                        queries.push({
                            qSelect: fieldsSelect,
                            qFrom: selectedMeasurement,
                            qWhere: `time > ${timeStart} and
                            time < ${timeEnd} and
                            ${vmFieldName}='${vm}'
                            group by time(${timeGroup})`
                        });
                    });
                } else {
                    _.each(measurementsList,(measurementData,measurement)=>{

                        var fieldsSelect = _.join(_.map(measurementData.fields,f=>{
                            return `mean(${f}) as ${f}`;
                        }),',');

                        queries.push({
                                qSelect: fieldsSelect,
                                qFrom: measurement,
                                qWhere: `time > ${timeStart} and
                                time < ${timeEnd} and
                                ${vmFieldName}='${selectedVm}'
                                group by time(${timeGroup})`
                            }
                        )
                    })
                }

                console.debug(queries);

                if (_.isEmpty(queries)) {
                    return Promise.resolve([]);
                } else {
                    return toolbox.getInternal().doPost('/monitor/new/query',null,queries);
                }
            })
            .then(results=>{
                var data = [];
                if (isManager || selectedVm) {
                    if (measurementsList.length === 1) {
                        results = [results];
                    }
                    var index=0;
                    _.each(measurementsList,(measurementData,measurement)=>{
                        if (data.length < 9 && results[index].length > 0) {
                            data.push({
                                measurement,
                                result: results[index]
                            });
                        }
                        index++;
                    })
                } else {
                    if (vms.length === 1) {
                        results = [results];
                    }

                    _.each(vms,(vm,index)=>{
                        if (data.length < 9 && results[index].length > 0) {
                            data.push({
                                vm,
                                result: results[index]
                            });
                        }
                    });
                }

                return {
                    vms,
                    selectedMeasurement,
                    selectedVm,
                    measurementsList,
                    timeStart,
                    timeEnd,
                    isManager,
                    data
                }
            });
    },

    render: function(widget,data,error,toolbox) {
        if (_.isEmpty(data)) {
            return <Stage.Basic.Loading/>;
        }

        console.log('Influx response is: ',data);

        return <MonitoringGraphs data={data} toolbox={toolbox}/>;
    }

});