let OutsourceConstants = require('../../constants/OutsourceConstants');
let AssignToTranslator = require('./AssignToTranslator').default;
let OutsourceVendor = require('./OutsourceVendor').default;
let CSSTransitionGroup = React.addons.CSSTransitionGroup;


class OutsourceContainer extends React.Component {


    constructor(props) {
        super(props);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    allowHTML(string) {
        return { __html: string };
    }

    getProjectAnalyzeUrl() {
        return '/analyze/' + this.props.project.get('project_slug') + '/' +this.props.project.get('id')+ '-' + this.props.project.get('password');
    }

    handleDocumentClick(evt)  {
        evt.stopPropagation();
        const area = ReactDOM.findDOMNode(this.container);

        if (this.container && !area.contains(evt.target) && !$(evt.target).hasClass('open-view-more')) {
            this.props.onClickOutside(evt)
        }
    }

    componentDidMount () {}

    componentWillUnmount() {
        window.removeEventListener('click', self.handleDocumentClick)
    }

    componentDidUpdate() {
        let self = this;
        if (this.props.openOutsource) {
            setTimeout(function () {
                window.addEventListener('click', self.handleDocumentClick)
            }, 600)
        } else {
            window.removeEventListener('click', self.handleDocumentClick)
        }
        $(this.languageTooltip).popup();
    }

    render() {
        let outsourceContainerClass = (!config.enable_outsource) ? ('no-outsource') : ((this.props.showTranslatorBox) ? 'showTranslator' : 'showOutsource');

        return <CSSTransitionGroup component="div" className="ui grid"
                                   transitionName="transitionOutsource"
                                   transitionEnterTimeout={500}
                                   transitionLeaveTimeout={300}
        >
            {this.props.openOutsource ? (
                <div className={"outsource-container chunk ui grid " + outsourceContainerClass}>
                    <div className=" outsource-header sixteen wide column shadow-1">
                        <div className="job-id" title="Job Id">
                            {"(" + this.props.idJobLabel + ")"}
                        </div>
                        <div className="source-target languages-tooltip"
                             ref={(tooltip) => this.languageTooltip = tooltip}
                             data-html={this.props.job.get('sourceTxt') + ' > ' + this.props.job.get('targetTxt')} data-variation="tiny">
                            <div className="source-box">
                                {this.props.job.get('sourceTxt')}
                            </div>
                            <div className="in-to"><i className="icon-chevron-right icon"/></div>
                            <div className="target-box">
                                {this.props.job.get('targetTxt')}
                            </div>
                        </div>
                        <div className="job-payable">
                            <a href={this.getProjectAnalyzeUrl()} target="_blank"><span id="words">{this.props.job.get('stats').get('TOTAL_FORMATTED')}</span> words</a>
                        </div>
                    </div>
                    <div className="sixteen wide column shadow-1">
                        <div className="ui grid"
                        ref={(container) => this.container = container}>
                                {(this.props.showTranslatorBox) ? (
                                    <AssignToTranslator job={this.props.job}
                                                        url={this.props.url}
                                                        project={this.props.project}/>
                                ) : (null)}

                                {(this.props.showTranslatorBox && config.enable_outsource) ? (
                                    <div className="divider-or sixteen wide column">
                                        <div className="or">
                                            OR
                                        </div>
                                    </div>
                                ) : (null)}
                                {config.enable_outsource ? (
                                    <OutsourceVendor project={this.props.project}
                                                     job={this.props.job}
                                                     extendedView={!this.props.showTranslatorBox}/>
                                ) :(null)}

                        </div>
                    </div>
                </div>
            ) : (null)}
        </CSSTransitionGroup>;
    }
}
OutsourceContainer.defaultProps = {
    showTranslatorBox: true
};

export default OutsourceContainer ;