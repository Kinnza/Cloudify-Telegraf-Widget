/**
 * Created by kinneretzin on 14/09/2017.
 */

export default class MonitoringGraphsFilter extends React.Component {

    constructor(props,context) {
        super(props,context);

        this._changeGraphSizes = this._changeGraphSizes.bind(this);
    }

    _handleMeasurementChange(proxy, field) {
        this.props.toolbox.getContext().setValue('selectedMeasurement',field.value);
        this.props.toolbox.getContext().setValue('selectedVm',null);
        this.props.toolbox.refresh();
    }

    _handleVmChange(proxy, field) {
        this.props.toolbox.getContext().setValue('selectedVm',field.value);
        this.props.toolbox.getContext().setValue('selectedMeasurement',null);
        this.props.toolbox.refresh();
    }

    _handleTimeRangeChange(proxy, field) {
        //this.props.toolbox.getContext().setValue('filterStateDate',field.startDate);
        //this.props.toolbox.getContext().setValue('filterEndDate',field.endDate);
        //this.props.toolbox.getContext().setValue('filterRange',field.value);
        //this.props.toolbox.refresh();
        let timeFilter = field.value;
        timeFilter = _.isEmpty(timeFilter.start) || _.isEmpty(timeFilter.end) ? undefined : timeFilter;
        this.props.toolbox.getContext().setValue('timeFilter', timeFilter);
        this.props.toolbox.refresh();
    }

    _changeGraphSizes(newSize) {
        if (newSize !== this.props.graphSizes) {
            this.props.onGraphSizesChanges(newSize);
        }
    }


    render(){
        let {Form,Popup,Button,InputTimeFilter} = Stage.Basic;
        var timeFilterValue = this.props.toolbox.getContext().getValue('timeFilter');

        var fieldElements = [
            <Form.Field key='timeFilter'>
                <InputTimeFilter
                            name='timeFilter'
                            value={timeFilterValue || InputTimeFilter.EMPTY_VALUE}
                            defaultValue={InputTimeFilter.EMPTY_VALUE}
                            placeholder='Click to set time range and resolution'
                            onApply={this._handleTimeRangeChange.bind(this)} />

            </Form.Field>,
            <Form.Field key='sizeChanger'>
                <Popup position="bottom center" on='click'>
                    <Popup.Trigger><Form.Button icon='maximize' title="change graphs sizes"></Form.Button></Popup.Trigger>
                    <Button.Group>
                        <Button active={this.props.graphSizes=='XL'} onClick={_.partial(this._changeGraphSizes,'XL')}>XL</Button>
                        <Button active={this.props.graphSizes=='L'} onClick={_.partial(this._changeGraphSizes,'L')}>L</Button>
                        <Button active={this.props.graphSizes=='M'} onClick={_.partial(this._changeGraphSizes,'M')}>M</Button>
                        <Button active={this.props.graphSizes=='S'} onClick={_.partial(this._changeGraphSizes,'S')}>S</Button>
                    </Button.Group>
                </Popup>
            </Form.Field>
        ];

        return (
            <Form size="small">
                {
                    this.props.isManager ?
                        <Form.Group inline widths="3">
                            {fieldElements}
                        </Form.Group>
                    :
                        <Form.Group inline widths="4">
                            <Form.Field>
                                <Form.Dropdown selection fluid
                                               placeholder="Vms"
                                               options={_.map(this.props.vms,vm=>{return {text:vm,value:vm};})}
                                               value={this.props.selectedVm || ''}
                                               onChange={this._handleVmChange.bind(this)}/>
                            </Form.Field>
                            <Form.Field>
                                <Form.Dropdown selection fluid
                                               placeholder="Measurement"
                                               options={this.props.measurements}
                                               value={this.props.selectedMeasurement || ''}
                                               onChange={this._handleMeasurementChange.bind(this)}/>
                            </Form.Field>
                            {fieldElements}
                        </Form.Group>
                }
            </Form>
        );
    }
}
