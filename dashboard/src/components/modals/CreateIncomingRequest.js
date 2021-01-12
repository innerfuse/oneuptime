import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { reduxForm, Field, FieldArray } from 'redux-form';
import { closeModal, openModal } from '../../actions/modal';
import ShouldRender from '../basic/ShouldRender';
import { FormLoader } from '../basic/Loader';
import { RenderField } from '../basic/RenderField';
import { RenderSelect } from '../basic/RenderSelect';
import { createIncomingRequest } from '../../actions/incomingRequest';
import IncomingRequestUrl from './IncomingRequestUrl';
import { RenderTextArea } from '../basic/RenderTextArea';
import Tooltip from '../basic/Tooltip';
import { incomingRequestVariables } from '../../config';
import { fetchCustomFields } from '../../actions/customField';
import { fetchCustomFields as fetchMonitorCustomFields } from '../../actions/monitorCustomField';
import CodeEditor from '../basic/CodeEditor';

function validate(values) {
    const errors = {};

    if (!values.name || !values.name.trim()) {
        errors.name = 'Incoming request name is required';
    }

    return errors;
}

const bulletpoints = {
    display: 'listItem',
    listStyleType: 'disc',
    listStylePosition: 'inside',
};

class CreateIncomingRequest extends Component {
    state = {
        monitorError: null,
    };

    componentDidMount() {
        const {
            fetchCustomFields,
            data,
            fetchMonitorCustomFields,
        } = this.props;
        const { projectId } = data;
        fetchCustomFields(projectId);
        fetchMonitorCustomFields(projectId);

        window.addEventListener('keydown', this.handleKeyBoard);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleKeyBoard);
    }

    submitForm = values => {
        const {
            closeModal,
            createIncomingRequest,
            data,
            openModal,
            customFields,
        } = this.props;
        const { projectId } = data;
        const postObj = {};

        postObj.name = values.name;
        postObj.isDefault = values.isDefault;

        if (values.nextAction && values.nextAction === 'createIncident') {
            postObj.createIncident = true;
            postObj.filterCriteria = values.filterCriteria;
            postObj.filterCondition = values.filterCondition;
            if (isNaN(values.filterText)) {
                postObj.filterText = values.filterText;
            } else {
                postObj.filterText = parseFloat(values.filterText);
            }
            postObj.incidentType = values.incidentType;
            if (values.dynamicIncidentType) {
                postObj.customIncidentType = values.customIncidentType;
                postObj.dynamicIncidentType = values.dynamicIncidentType;
            }
            postObj.incidentTitle = values.incidentTitle;
            postObj.incidentPriority = values.incidentPriority;
            if (values.dynamicIncidentPriority) {
                // create this incident priority on the BE
                postObj.customIncidentPriority = values.customIncidentPriority;
                postObj.dynamicIncidentPriority =
                    values.dynamicIncidentPriority;
            }
            postObj.incidentDescription = values.incidentDescription;

            postObj.customFields = customFields.map(field => ({
                fieldName: field.fieldName,
                fieldValue:
                    field.fieldType === 'number'
                        ? parseFloat(values[field.fieldName])
                        : values[field.fieldName],
            }));

            postObj.monitors = [];
            if (!postObj.isDefault) {
                if (values.monitors && values.monitors.length > 0) {
                    const monitors = values.monitors.filter(
                        monitorId => typeof monitorId === 'string'
                    );
                    postObj.monitors = monitors;
                }

                const isDuplicate = postObj.monitors
                    ? postObj.monitors.length === new Set(postObj.monitors).size
                        ? false
                        : true
                    : false;

                if (isDuplicate) {
                    this.setState({
                        monitorError: 'Duplicate monitor selection found',
                    });
                    postObj.monitors = [];
                    return;
                }
            }
        }

        if (values.nextAction && values.nextAction === 'updateIncidentNote') {
            postObj.updateIncidentNote = true;
        }

        if (values.nextAction && values.nextAction === 'updateInternalNote') {
            postObj.updateInternalNote = true;
        }

        if (
            values.nextAction &&
            (values.nextAction === 'updateIncidentNote' ||
                values.nextAction === 'updateInternalNote')
        ) {
            postObj.filterCriteria = values.filterCriteria;
            postObj.filterCondition = values.filterCondition;
            if (isNaN(values.filterText)) {
                postObj.filterText = values.filterText;
            } else {
                postObj.filterText = parseFloat(values.filterText);
            }

            postObj.noteContent = values.noteContent;
            postObj.incidentState = values.incidentState;
            if (values.incidentState === 'others') {
                postObj.incidentState = values.customIncidentState;
            }
        }

        if (values.nextAction && values.nextAction === 'acknowledgeIncident') {
            postObj.acknowledgeIncident = true;
        }

        if (values.nextAction && values.nextAction === 'resolveIncident') {
            postObj.resolveIncident = true;
        }

        if (
            values.nextAction &&
            (values.nextAction === 'acknowledgeIncident' ||
                values.nextAction === 'resolveIncident')
        ) {
            postObj.filterCriteria = values.filterCriteria;
            postObj.filterCondition = values.filterCondition;
            if (isNaN(values.filterText)) {
                postObj.filterText = values.filterText;
            } else {
                postObj.filterText = parseFloat(values.filterText);
            }
        }

        createIncomingRequest(projectId, postObj).then(() => {
            if (!this.props.requesting && !this.props.requestError) {
                closeModal({
                    id: projectId, // the projectId was used as the id for this modal
                });
                this.props.destroy();
                openModal({
                    id: projectId,
                    content: IncomingRequestUrl,
                });
            }
        });
    };

    renderMonitors = ({ fields }) => {
        const { monitorError } = this.state;
        return (
            <>
                <div
                    style={{
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    <button
                        id="addMoreMonitor"
                        className="Button bs-ButtonLegacy ActionIconParent"
                        style={{
                            position: 'absolute',
                            zIndex: 1,
                            right: 0,
                        }}
                        type="button"
                        onClick={() => {
                            fields.push();
                        }}
                    >
                        <span className="bs-Button bs-FileUploadButton bs-Button--icon bs-Button--new">
                            <span>Add Monitor</span>
                        </span>
                    </button>
                    {fields.map((field, index) => {
                        return (
                            <div
                                style={{
                                    width: '65%',
                                    marginBottom: 10,
                                }}
                                key={index}
                            >
                                <Field
                                    className="db-select-nw Table-cell--width--maximized"
                                    component={RenderSelect}
                                    name={field}
                                    id={`monitorfield_${index}`}
                                    placeholder="Monitor"
                                    style={{
                                        height: '28px',
                                        width: '100%',
                                    }}
                                    options={[
                                        {
                                            value: '',
                                            label: 'Select a Monitor',
                                        },
                                        ...(this.props.monitors &&
                                        this.props.monitors.length > 0
                                            ? this.props.monitors.map(
                                                  monitor => ({
                                                      value: monitor._id,
                                                      label: `${monitor.componentId.name} / ${monitor.name}`,
                                                  })
                                              )
                                            : []),
                                    ]}
                                />
                                <button
                                    id="removeMonitor"
                                    className="Button bs-ButtonLegacy ActionIconParent"
                                    style={{
                                        marginTop: 10,
                                    }}
                                    type="button"
                                    onClick={() => {
                                        fields.remove(index);
                                    }}
                                >
                                    <span className="bs-Button bs-Button--icon bs-Button--delete">
                                        <span>Remove Monitor</span>
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                    {monitorError && (
                        <div
                            className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                            style={{
                                marginTop: '5px',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                className="Box-root Margin-right--8"
                                style={{ marginTop: '2px' }}
                            >
                                <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                            </div>
                            <div className="Box-root">
                                <span
                                    id="monitorError"
                                    style={{ color: 'red' }}
                                >
                                    {monitorError}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    };

    handleKeyBoard = e => {
        const { closeModal, data, destroy } = this.props;
        const { projectId } = data;

        switch (e.key) {
            case 'Escape':
                destroy();
                return closeModal({
                    id: projectId,
                });
            case 'Enter':
                if (e.target.localName !== 'textarea') {
                    return document
                        .getElementById('createIncomingRequest')
                        .click();
                }
                break;
            default:
                return false;
        }
    };

    toggleShowAdvancedOptions = () =>
        this.props.change(
            'showAdvancedOptions',
            !this.props.formValues.showAdvancedOptions
        );

    toggleShowAvailableVariables = () =>
        this.props.change(
            'showAvailableVariables',
            !this.props.formValues.showAvailableVariables
        );

    onContentChange = val => {
        this.props.change('noteContent', val);
    };

    render() {
        const {
            handleSubmit,
            data,
            formValues,
            closeModal,
            incidentPriorities,
            customFields,
            monitorCustomFields,
        } = this.props;
        const { projectId } = data;

        return (
            <div
                className="ModalLayer-contents"
                tabIndex="-1"
                style={{ marginTop: '40px' }}
            >
                <div className="bs-BIM">
                    <div className="bs-Modal" style={{ width: 700 }}>
                        <div className="bs-Modal-header">
                            <div
                                className="bs-Modal-header-copy"
                                style={{
                                    marginBottom: '10px',
                                    marginTop: '10px',
                                }}
                            >
                                <span className="Text-color--inherit Text-display--inline Text-fontSize--20 Text-fontWeight--medium Text-lineHeight--24 Text-typeface--base Text-wrap--wrap">
                                    <span>Create Incoming HTTP Request</span>
                                </span>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit(this.submitForm)}>
                            <div className="bs-Modal-content">
                                <div className="bs-Fieldset-wrapper Box-root Margin-bottom--2">
                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="name"
                                                    style={{ flexBasis: '20%' }}
                                                >
                                                    <span>Name</span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Field
                                                            component={
                                                                RenderField
                                                            }
                                                            name="name"
                                                            type="input"
                                                            placeholder="Name of request"
                                                            id="name"
                                                            className="db-BusinessSettings-input TextInput bs-TextInput"
                                                            style={{
                                                                width: '100%',
                                                                padding:
                                                                    '3px 5px',
                                                            }}
                                                            autoFocus={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset style={{ paddingTop: 0 }}>
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    style={{
                                                        flexBasis: '20%',
                                                    }}
                                                ></label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        What would you like to
                                                        do
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset>
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="createIncident"
                                                    style={{ flexBasis: '20%' }}
                                                >
                                                    <span></span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        paddingTop: '6px',
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div className="bs-Fieldset-field">
                                                        <label
                                                            className="bs-Radio"
                                                            style={{
                                                                marginRight:
                                                                    '12px',
                                                            }}
                                                            htmlFor="createIncident"
                                                        >
                                                            <Field
                                                                component="input"
                                                                type="radio"
                                                                name="nextAction"
                                                                className="bs-Radio-source"
                                                                id="createIncident"
                                                                value="createIncident"
                                                                style={{
                                                                    width: 0,
                                                                }}
                                                            />
                                                            <span className="bs-Radio-button"></span>
                                                            <div
                                                                className="Box-root"
                                                                style={{
                                                                    paddingLeft:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <span>
                                                                    Create
                                                                    Incident
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset>
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="acknowledgeIncident"
                                                    style={{ flexBasis: '20%' }}
                                                >
                                                    <span></span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        paddingTop: '6px',
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div className="bs-Fieldset-field">
                                                        <label
                                                            className="bs-Radio"
                                                            style={{
                                                                marginRight:
                                                                    '12px',
                                                            }}
                                                            htmlFor="acknowledgeIncident"
                                                        >
                                                            <Field
                                                                component="input"
                                                                type="radio"
                                                                name="nextAction"
                                                                className="bs-Radio-source"
                                                                id="acknowledgeIncident"
                                                                value="acknowledgeIncident"
                                                                style={{
                                                                    width: 0,
                                                                }}
                                                            />
                                                            <span className="bs-Radio-button"></span>
                                                            <div
                                                                className="Box-root"
                                                                style={{
                                                                    paddingLeft:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <span>
                                                                    Acknowledge
                                                                    Incident
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset>
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="resolveIncident"
                                                    style={{ flexBasis: '20%' }}
                                                >
                                                    <span></span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        paddingTop: '6px',
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div className="bs-Fieldset-field">
                                                        <label
                                                            className="bs-Radio"
                                                            style={{
                                                                marginRight:
                                                                    '12px',
                                                            }}
                                                            htmlFor="resolveIncident"
                                                        >
                                                            <Field
                                                                component="input"
                                                                type="radio"
                                                                name="nextAction"
                                                                className="bs-Radio-source"
                                                                id="resolveIncident"
                                                                value="resolveIncident"
                                                                style={{
                                                                    width: 0,
                                                                }}
                                                            />
                                                            <span className="bs-Radio-button"></span>
                                                            <div
                                                                className="Box-root"
                                                                style={{
                                                                    paddingLeft:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <span>
                                                                    Resolve
                                                                    Incident
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset>
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="updateIncidentNote"
                                                    style={{ flexBasis: '20%' }}
                                                >
                                                    <span></span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        paddingTop: '6px',
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div className="bs-Fieldset-field">
                                                        <label
                                                            className="bs-Radio"
                                                            style={{
                                                                marginRight:
                                                                    '12px',
                                                            }}
                                                            htmlFor="updateIncidentNote"
                                                        >
                                                            <Field
                                                                component="input"
                                                                type="radio"
                                                                name="nextAction"
                                                                className="bs-Radio-source"
                                                                id="updateIncidentNote"
                                                                value="updateIncidentNote"
                                                                style={{
                                                                    width: 0,
                                                                }}
                                                            />
                                                            <span className="bs-Radio-button"></span>
                                                            <div
                                                                className="Box-root"
                                                                style={{
                                                                    paddingLeft:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <span>
                                                                    Update
                                                                    Incident
                                                                    Note
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset className="Margin-bottom--16">
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="updateInternalNote"
                                                    style={{ flexBasis: '20%' }}
                                                >
                                                    <span></span>
                                                </label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        paddingTop: '6px',
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div className="bs-Fieldset-field">
                                                        <label
                                                            className="bs-Radio"
                                                            style={{
                                                                marginRight:
                                                                    '12px',
                                                            }}
                                                            htmlFor="updateInternalNote"
                                                        >
                                                            <Field
                                                                component="input"
                                                                type="radio"
                                                                name="nextAction"
                                                                className="bs-Radio-source"
                                                                id="updateInternalNote"
                                                                value="updateInternalNote"
                                                                style={{
                                                                    width: 0,
                                                                }}
                                                            />
                                                            <span className="bs-Radio-button"></span>
                                                            <div
                                                                className="Box-root"
                                                                style={{
                                                                    paddingLeft:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <span>
                                                                    Update
                                                                    Internal
                                                                    Note
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    {formValues &&
                                        !formValues.isDefault &&
                                        formValues.nextAction ===
                                            'createIncident' && (
                                            <fieldset className="Margin-bottom--16">
                                                <div className="bs-Fieldset-rows">
                                                    <div
                                                        className="bs-Fieldset-row"
                                                        style={{
                                                            padding: 0,
                                                        }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            style={{
                                                                flexBasis:
                                                                    '20%',
                                                            }}
                                                        >
                                                            <span>
                                                                Monitors
                                                            </span>
                                                        </label>
                                                        <div
                                                            className="bs-Fieldset-fields"
                                                            style={{
                                                                flexBasis:
                                                                    '80%',
                                                                maxWidth: '80%',
                                                            }}
                                                        >
                                                            <div
                                                                className="bs-Fieldset-field"
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                }}
                                                            >
                                                                <FieldArray
                                                                    name="monitors"
                                                                    component={
                                                                        this
                                                                            .renderMonitors
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </fieldset>
                                        )}

                                    {formValues &&
                                        formValues.nextAction ===
                                            'createIncident' && (
                                            <fieldset className="Margin-bottom--16">
                                                <div className="bs-Fieldset-rows">
                                                    <div
                                                        className="bs-Fieldset-row"
                                                        style={{
                                                            padding: 0,
                                                        }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            htmlFor="isDefault"
                                                            style={{
                                                                flexBasis:
                                                                    '20%',
                                                            }}
                                                        >
                                                            <span></span>
                                                        </label>
                                                        <div
                                                            className="bs-Fieldset-fields"
                                                            style={{
                                                                paddingTop:
                                                                    '6px',
                                                                flexBasis:
                                                                    '80%',
                                                                maxWidth: '80%',
                                                            }}
                                                        >
                                                            <div className="bs-Fieldset-field">
                                                                <label
                                                                    className="Checkbox"
                                                                    style={{
                                                                        marginRight:
                                                                            '12px',
                                                                    }}
                                                                    htmlFor="isDefault"
                                                                >
                                                                    <Field
                                                                        component="input"
                                                                        type="checkbox"
                                                                        name="isDefault"
                                                                        className="Checkbox-source"
                                                                        id="isDefault"
                                                                    />
                                                                    <div className="Checkbox-box Box-root Margin-right--2">
                                                                        <div className="Checkbox-target Box-root">
                                                                            <div className="Checkbox-color Box-root"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        className="Box-root"
                                                                        style={{
                                                                            paddingLeft:
                                                                                '5px',
                                                                        }}
                                                                    >
                                                                        <span>
                                                                            Use
                                                                            as
                                                                            default
                                                                            incoming
                                                                            request
                                                                        </span>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </fieldset>
                                        )}

                                    <fieldset style={{ paddingTop: 0 }}>
                                        <div className="bs-Fieldset-rows">
                                            <div
                                                className="bs-Fieldset-row"
                                                style={{ padding: 0 }}
                                            >
                                                <label
                                                    className="bs-Fieldset-label Text-align--left"
                                                    htmlFor="showAdvancedOptions"
                                                    style={{
                                                        flexBasis: '20%',
                                                    }}
                                                ></label>
                                                <div
                                                    className="bs-Fieldset-fields"
                                                    style={{
                                                        flexBasis: '80%',
                                                        maxWidth: '80%',
                                                    }}
                                                >
                                                    <div
                                                        className="bs-Fieldset-field"
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 0px',
                                                            textDecoration:
                                                                'underline',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                cursor:
                                                                    'pointer',
                                                            }}
                                                            onClick={
                                                                this
                                                                    .toggleShowAdvancedOptions
                                                            }
                                                        >
                                                            {formValues &&
                                                            formValues.showAdvancedOptions
                                                                ? 'Hide advanced options'
                                                                : 'Show advanced options'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>

                                    {formValues &&
                                        formValues.showAdvancedOptions &&
                                        (formValues.nextAction ===
                                            'acknowledgeIncident' ||
                                            formValues.nextAction ===
                                                'resolveIncident') && (
                                            <fieldset className="Margin-bottom--16">
                                                <div className="bs-Fieldset-rows">
                                                    <div
                                                        className="bs-Fieldset-row"
                                                        style={{
                                                            padding: 0,
                                                        }}
                                                    >
                                                        <label
                                                            className="bs-Fieldset-label Text-align--left"
                                                            style={{
                                                                flexBasis:
                                                                    '20%',
                                                            }}
                                                        >
                                                            <span>Filters</span>
                                                        </label>
                                                        <div
                                                            className="bs-Fieldset-fields"
                                                            style={{
                                                                flexBasis:
                                                                    '80%',
                                                                maxWidth: '80%',
                                                            }}
                                                        >
                                                            <div
                                                                className="bs-Fieldset-field"
                                                                style={{
                                                                    width:
                                                                        '100%',
                                                                }}
                                                            >
                                                                <Field
                                                                    className="db-select-nw Table-cell--width--maximized"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name="filterCriteria"
                                                                    id="filterCriteria"
                                                                    placeholder="Criteria"
                                                                    style={{
                                                                        height:
                                                                            '28px',
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                    options={[
                                                                        {
                                                                            value:
                                                                                'incidentId',
                                                                            label:
                                                                                'Incident ID',
                                                                        },
                                                                        ...customFields.map(
                                                                            field => ({
                                                                                value:
                                                                                    field.fieldName,
                                                                                label:
                                                                                    field.fieldName,
                                                                            })
                                                                        ),
                                                                    ]}
                                                                />
                                                                <Field
                                                                    className="db-select-nw Table-cell--width--maximized"
                                                                    component={
                                                                        RenderSelect
                                                                    }
                                                                    name="filterCondition"
                                                                    id="filterCondition"
                                                                    placeholder="Condition"
                                                                    style={{
                                                                        height:
                                                                            '28px',
                                                                        width:
                                                                            '100%',
                                                                        marginLeft: 5,
                                                                    }}
                                                                    options={[
                                                                        {
                                                                            value:
                                                                                'equalTo',
                                                                            label:
                                                                                'Equal To',
                                                                        },
                                                                        {
                                                                            value:
                                                                                'notEqualTo',
                                                                            label:
                                                                                'Not Equal To',
                                                                        },
                                                                    ]}
                                                                />
                                                                <Field
                                                                    component={
                                                                        RenderField
                                                                    }
                                                                    name="filterText"
                                                                    type={
                                                                        formValues.filterCriteria
                                                                            ? (
                                                                                  customFields.find(
                                                                                      field =>
                                                                                          field.fieldName ===
                                                                                          formValues.filterCriteria
                                                                                  ) || {
                                                                                      fieldType:
                                                                                          'text',
                                                                                  }
                                                                              )
                                                                                  .fieldType
                                                                            : 'text'
                                                                    }
                                                                    placeholder="request.body.value"
                                                                    id="filterText"
                                                                    className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                        padding:
                                                                            '3px 5px',
                                                                        marginLeft: 5,
                                                                    }}
                                                                    parentStyle={{
                                                                        marginRight: 5,
                                                                    }}
                                                                />
                                                                <Tooltip title="Incoming http Request Filter">
                                                                    <p>
                                                                        Filter
                                                                        exposes
                                                                        the{' '}
                                                                        <code>
                                                                            request
                                                                        </code>{' '}
                                                                        object
                                                                        of an
                                                                        incoming
                                                                        request.
                                                                        The
                                                                        value on
                                                                        the{' '}
                                                                        <code>
                                                                            request
                                                                        </code>{' '}
                                                                        object
                                                                        can
                                                                        either
                                                                        be a
                                                                        string
                                                                        or a
                                                                        number
                                                                    </p>
                                                                    <p>
                                                                        Example
                                                                        properties
                                                                        include
                                                                        the
                                                                        following:
                                                                    </p>
                                                                    <p>
                                                                        <ul>
                                                                            <li>
                                                                                <code>
                                                                                    request.body
                                                                                </code>
                                                                            </li>
                                                                            <li>
                                                                                <code>
                                                                                    request.query
                                                                                </code>
                                                                            </li>
                                                                            <li>
                                                                                <code>
                                                                                    request.headers
                                                                                </code>
                                                                            </li>
                                                                        </ul>
                                                                    </p>
                                                                    <p>
                                                                        Usage
                                                                        examples
                                                                        include:
                                                                    </p>
                                                                    <p>
                                                                        <ul>
                                                                            <li>
                                                                                <code>
                                                                                    1
                                                                                    |
                                                                                    request.body.value
                                                                                </code>
                                                                            </li>
                                                                            <li>
                                                                                <code>
                                                                                    2
                                                                                    |
                                                                                    request.query.value
                                                                                </code>
                                                                            </li>
                                                                            <li>
                                                                                <code>
                                                                                    3
                                                                                    |
                                                                                    request.header.value
                                                                                </code>
                                                                            </li>
                                                                        </ul>
                                                                    </p>
                                                                    <p>
                                                                        You can
                                                                        pass the
                                                                        value of{' '}
                                                                        <code>
                                                                            request
                                                                        </code>{' '}
                                                                        object
                                                                        directly
                                                                        or you
                                                                        can
                                                                        specify
                                                                        the{' '}
                                                                        <code>
                                                                            request
                                                                        </code>{' '}
                                                                        body as
                                                                        a
                                                                        variable{' '}
                                                                        <code>
                                                                            {
                                                                                '{{request.body.value}}'
                                                                            }
                                                                        </code>
                                                                    </p>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </fieldset>
                                        )}

                                    {formValues &&
                                        formValues.showAdvancedOptions &&
                                        (formValues.nextAction ===
                                            'updateInternalNote' ||
                                            formValues.nextAction ===
                                                'updateIncidentNote') && (
                                            <>
                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Filters
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <Field
                                                                        className="db-select-nw Table-cell--width--maximized"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="filterCriteria"
                                                                        id="filterCriteria"
                                                                        placeholder="Criteria"
                                                                        style={{
                                                                            height:
                                                                                '28px',
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    'incidentId',
                                                                                label:
                                                                                    'Incident ID',
                                                                            },
                                                                            ...customFields.map(
                                                                                field => ({
                                                                                    value:
                                                                                        field.fieldName,
                                                                                    label:
                                                                                        field.fieldName,
                                                                                })
                                                                            ),
                                                                        ]}
                                                                    />
                                                                    <Field
                                                                        className="db-select-nw Table-cell--width--maximized"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="filterCondition"
                                                                        id="filterCondition"
                                                                        placeholder="Condition"
                                                                        style={{
                                                                            height:
                                                                                '28px',
                                                                            width:
                                                                                '100%',
                                                                            marginLeft: 5,
                                                                        }}
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    'equalTo',
                                                                                label:
                                                                                    'Equal To',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'notEqualTo',
                                                                                label:
                                                                                    'Not Equal To',
                                                                            },
                                                                        ]}
                                                                    />
                                                                    <Field
                                                                        component={
                                                                            RenderField
                                                                        }
                                                                        name="filterText"
                                                                        type={
                                                                            formValues.filterCriteria
                                                                                ? (
                                                                                      customFields.find(
                                                                                          field =>
                                                                                              field.fieldName ===
                                                                                              formValues.filterCriteria
                                                                                      ) || {
                                                                                          fieldType:
                                                                                              'text',
                                                                                      }
                                                                                  )
                                                                                      .fieldType
                                                                                : 'text'
                                                                        }
                                                                        placeholder="request.body.value"
                                                                        id="filterText"
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                            padding:
                                                                                '3px 5px',
                                                                            marginLeft: 5,
                                                                        }}
                                                                        parentStyle={{
                                                                            marginRight: 5,
                                                                        }}
                                                                    />
                                                                    <Tooltip title="Incoming http Request Filter">
                                                                        <p>
                                                                            Filter
                                                                            exposes
                                                                            the{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            object
                                                                            of
                                                                            an
                                                                            incoming
                                                                            request.
                                                                            The
                                                                            value
                                                                            on
                                                                            the{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            object
                                                                            can
                                                                            either
                                                                            be a
                                                                            string
                                                                            or a
                                                                            number
                                                                        </p>
                                                                        <p>
                                                                            Example
                                                                            properties
                                                                            include
                                                                            the
                                                                            following:
                                                                        </p>
                                                                        <p>
                                                                            <ul>
                                                                                <li>
                                                                                    <code>
                                                                                        request.body
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        request.query
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        request.headers
                                                                                    </code>
                                                                                </li>
                                                                            </ul>
                                                                        </p>
                                                                        <p>
                                                                            Usage
                                                                            examples
                                                                            include:
                                                                        </p>
                                                                        <p>
                                                                            <ul>
                                                                                <li>
                                                                                    <code>
                                                                                        1
                                                                                        |
                                                                                        request.body.value
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        2
                                                                                        |
                                                                                        request.query.value
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        3
                                                                                        |
                                                                                        request.header.value
                                                                                    </code>
                                                                                </li>
                                                                            </ul>
                                                                        </p>
                                                                        <p>
                                                                            You
                                                                            can
                                                                            pass
                                                                            the
                                                                            value
                                                                            of{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            object
                                                                            directly
                                                                            or
                                                                            you
                                                                            can
                                                                            specify
                                                                            the{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            body
                                                                            as a
                                                                            variable{' '}
                                                                            <code>
                                                                                {
                                                                                    '{{request.body.value}}'
                                                                                }
                                                                            </code>
                                                                        </p>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>

                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="incidentState"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Incident
                                                                    State
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <Field
                                                                        className="db-select-nw-300"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="incidentState"
                                                                        id="incidentState"
                                                                        placeholder="Incident State"
                                                                        disabled={
                                                                            false
                                                                        }
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    'investigating',
                                                                                label:
                                                                                    'Investigating',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'update',
                                                                                label:
                                                                                    'Update',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'others',
                                                                                label:
                                                                                    'Others',
                                                                            },
                                                                        ]}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>

                                                {formValues &&
                                                    formValues.incidentState ===
                                                        'others' && (
                                                        <fieldset className="Margin-bottom--16">
                                                            <div className="bs-Fieldset-rows">
                                                                <div
                                                                    className="bs-Fieldset-row"
                                                                    style={{
                                                                        padding: 0,
                                                                    }}
                                                                >
                                                                    <label
                                                                        className="bs-Fieldset-label Text-align--left"
                                                                        htmlFor="customIncidentState"
                                                                        style={{
                                                                            flexBasis:
                                                                                '20%',
                                                                        }}
                                                                    >
                                                                        <span>
                                                                            Custom
                                                                            Incident
                                                                            State
                                                                        </span>
                                                                    </label>
                                                                    <div
                                                                        className="bs-Fieldset-fields"
                                                                        style={{
                                                                            flexBasis:
                                                                                '80%',
                                                                            maxWidth:
                                                                                '80%',
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="bs-Fieldset-field"
                                                                            style={{
                                                                                width:
                                                                                    '100%',
                                                                            }}
                                                                        >
                                                                            <Field
                                                                                className="db-BusinessSettings-input-300 TextInput bs-TextInput"
                                                                                component={
                                                                                    RenderField
                                                                                }
                                                                                type="text"
                                                                                name={`customIncidentState`}
                                                                                id="customIncidentState"
                                                                                placeholder="Enter a custom incident state"
                                                                                style={{
                                                                                    width:
                                                                                        '100%',
                                                                                }}
                                                                                required={
                                                                                    true
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </fieldset>
                                                    )}

                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="noteContent"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Investigation
                                                                    Note
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <CodeEditor
                                                                        code={
                                                                            formValues.noteContent
                                                                        }
                                                                        onCodeChange={
                                                                            this
                                                                                .onContentChange
                                                                        }
                                                                        textareaId="newNoteContent"
                                                                        placeholder="This can be markdown"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                        required={
                                                                            true
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                            </>
                                        )}

                                    {formValues &&
                                        formValues.showAdvancedOptions &&
                                        formValues.nextAction ===
                                            'createIncident' && (
                                            <>
                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Filters
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <Field
                                                                        className="db-select-nw Table-cell--width--maximized"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="filterCriteria"
                                                                        id="filterCriteria"
                                                                        placeholder="Criteria"
                                                                        style={{
                                                                            height:
                                                                                '28px',
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                        options={[
                                                                            ...monitorCustomFields.map(
                                                                                field => ({
                                                                                    value:
                                                                                        field.fieldName,
                                                                                    label:
                                                                                        field.fieldName,
                                                                                })
                                                                            ),
                                                                        ]}
                                                                    />
                                                                    <Field
                                                                        className="db-select-nw Table-cell--width--maximized"
                                                                        component={
                                                                            RenderSelect
                                                                        }
                                                                        name="filterCondition"
                                                                        id="filterCondition"
                                                                        placeholder="Condition"
                                                                        style={{
                                                                            height:
                                                                                '28px',
                                                                            width:
                                                                                '100%',
                                                                            marginLeft: 5,
                                                                        }}
                                                                        options={[
                                                                            {
                                                                                value:
                                                                                    'equalTo',
                                                                                label:
                                                                                    'Equal To',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'notEqualTo',
                                                                                label:
                                                                                    'Not Equal To',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'greaterThan',
                                                                                label:
                                                                                    'Greater Than',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'lessThan',
                                                                                label:
                                                                                    'Less Than',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'lessThanOrEqualTo',
                                                                                label:
                                                                                    'Less Than Or Equal To',
                                                                            },
                                                                            {
                                                                                value:
                                                                                    'greaterThanOrEqualTo',
                                                                                label:
                                                                                    'Greater Than Or Equal To',
                                                                            },
                                                                        ]}
                                                                    />
                                                                    <Field
                                                                        component={
                                                                            RenderField
                                                                        }
                                                                        name="filterText"
                                                                        type={
                                                                            formValues.filterCriteria
                                                                                ? (
                                                                                      monitorCustomFields.find(
                                                                                          field =>
                                                                                              field.fieldName ===
                                                                                              formValues.filterCriteria
                                                                                      ) || {
                                                                                          fieldType:
                                                                                              'text',
                                                                                      }
                                                                                  )
                                                                                      .fieldType
                                                                                : 'text'
                                                                        }
                                                                        placeholder="request.body.value"
                                                                        id="filterText"
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                            padding:
                                                                                '3px 5px',
                                                                            marginLeft: 5,
                                                                        }}
                                                                        parentStyle={{
                                                                            marginRight: 5,
                                                                        }}
                                                                    />
                                                                    <Tooltip title="Incoming http Request Filter">
                                                                        <p>
                                                                            Filter
                                                                            exposes
                                                                            the{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            object
                                                                            of
                                                                            an
                                                                            incoming
                                                                            request.
                                                                            The
                                                                            value
                                                                            on
                                                                            the{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            object
                                                                            can
                                                                            either
                                                                            be a
                                                                            string
                                                                            or a
                                                                            number
                                                                        </p>
                                                                        <p>
                                                                            Example
                                                                            properties
                                                                            include
                                                                            the
                                                                            following:
                                                                        </p>
                                                                        <p>
                                                                            <ul>
                                                                                <li>
                                                                                    <code>
                                                                                        request.body
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        request.query
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        request.headers
                                                                                    </code>
                                                                                </li>
                                                                            </ul>
                                                                        </p>
                                                                        <p>
                                                                            Usage
                                                                            examples
                                                                            include:
                                                                        </p>
                                                                        <p>
                                                                            <ul>
                                                                                <li>
                                                                                    <code>
                                                                                        1
                                                                                        |
                                                                                        request.body.value
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        2
                                                                                        |
                                                                                        request.query.value
                                                                                    </code>
                                                                                </li>
                                                                                <li>
                                                                                    <code>
                                                                                        3
                                                                                        |
                                                                                        request.header.value
                                                                                    </code>
                                                                                </li>
                                                                            </ul>
                                                                        </p>
                                                                        <p>
                                                                            You
                                                                            can
                                                                            pass
                                                                            the
                                                                            value
                                                                            of{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            object
                                                                            directly
                                                                            or
                                                                            you
                                                                            can
                                                                            specify
                                                                            the{' '}
                                                                            <code>
                                                                                request
                                                                            </code>{' '}
                                                                            body
                                                                            as a
                                                                            variable{' '}
                                                                            <code>
                                                                                {
                                                                                    '{{request.body.value}}'
                                                                                }
                                                                            </code>
                                                                        </p>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                                <fieldset>
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="name"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            ></label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                            paddingBottom: 10,
                                                                            fontWeight: 500,
                                                                            fontSize: 14,
                                                                        }}
                                                                    >
                                                                        Incidents
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="incidentTitle"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Incident
                                                                    Title
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <Field
                                                                        component={
                                                                            RenderField
                                                                        }
                                                                        name="incidentTitle"
                                                                        type="input"
                                                                        placeholder="Monitor is offline"
                                                                        id="incidentTitle"
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                            padding:
                                                                                '3px 5px',
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="incidentType"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Incident
                                                                    Type
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    {formValues &&
                                                                    !formValues.dynamicIncidentType ? (
                                                                        <Field
                                                                            className="db-select-nw"
                                                                            component={
                                                                                RenderSelect
                                                                            }
                                                                            name="incidentType"
                                                                            id="incidentType"
                                                                            placeholder="Incident type"
                                                                            disabled={
                                                                                this
                                                                                    .props
                                                                                    .requesting
                                                                            }
                                                                            options={[
                                                                                {
                                                                                    value:
                                                                                        'online',
                                                                                    label:
                                                                                        'Online',
                                                                                },
                                                                                {
                                                                                    value:
                                                                                        'offline',
                                                                                    label:
                                                                                        'Offline',
                                                                                },
                                                                                {
                                                                                    value:
                                                                                        'degraded',
                                                                                    label:
                                                                                        'Degraded',
                                                                                },
                                                                            ]}
                                                                        />
                                                                    ) : (
                                                                        <Field
                                                                            className="db-BusinessSettings-input-300 TextInput bs-TextInput"
                                                                            component={
                                                                                RenderField
                                                                            }
                                                                            type="text"
                                                                            name="customIncidentType"
                                                                            id="incidentType"
                                                                            placeholder="Incident Type"
                                                                            style={{
                                                                                width:
                                                                                    '100%',
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div
                                                                    onClick={() =>
                                                                        this.props.change(
                                                                            'dynamicIncidentType',
                                                                            true
                                                                        )
                                                                    }
                                                                    style={{
                                                                        cursor:
                                                                            'pointer',
                                                                        marginTop: 5,
                                                                        textDecoration:
                                                                            'underline',
                                                                    }}
                                                                >
                                                                    use dynamic
                                                                    values
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                                <ShouldRender
                                                    if={
                                                        incidentPriorities.length >
                                                        0
                                                    }
                                                >
                                                    <fieldset className="Margin-bottom--16">
                                                        <div className="bs-Fieldset-rows">
                                                            <div
                                                                className="bs-Fieldset-row"
                                                                style={{
                                                                    padding: 0,
                                                                }}
                                                            >
                                                                <label
                                                                    className="bs-Fieldset-label Text-align--left"
                                                                    htmlFor="incidentPriority"
                                                                    style={{
                                                                        flexBasis:
                                                                            '20%',
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Incident
                                                                        Priority
                                                                    </span>
                                                                </label>
                                                                <div
                                                                    className="bs-Fieldset-fields"
                                                                    style={{
                                                                        flexBasis:
                                                                            '80%',
                                                                        maxWidth:
                                                                            '80%',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="bs-Fieldset-field"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                        }}
                                                                    >
                                                                        {formValues &&
                                                                        !formValues.dynamicIncidentPriority ? (
                                                                            <Field
                                                                                style={{
                                                                                    width:
                                                                                        '100%',
                                                                                }}
                                                                                className="db-select-nw"
                                                                                component={
                                                                                    RenderSelect
                                                                                }
                                                                                name="incidentPriority"
                                                                                id="incidentPriority"
                                                                                disabled={
                                                                                    this
                                                                                        .props
                                                                                        .requesting
                                                                                }
                                                                                options={[
                                                                                    ...incidentPriorities.map(
                                                                                        incidentPriority => ({
                                                                                            value:
                                                                                                incidentPriority._id,
                                                                                            label:
                                                                                                incidentPriority.name,
                                                                                        })
                                                                                    ),
                                                                                ]}
                                                                            />
                                                                        ) : (
                                                                            <Field
                                                                                className="db-BusinessSettings-input-300 TextInput bs-TextInput"
                                                                                component={
                                                                                    RenderField
                                                                                }
                                                                                type="text"
                                                                                name="customIncidentPriority"
                                                                                id="incidentPriority"
                                                                                placeholder="Incident Priority"
                                                                                style={{
                                                                                    width:
                                                                                        '100%',
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        onClick={() =>
                                                                            this.props.change(
                                                                                'dynamicIncidentPriority',
                                                                                true
                                                                            )
                                                                        }
                                                                        style={{
                                                                            cursor:
                                                                                'pointer',
                                                                            marginTop: 5,
                                                                            textDecoration:
                                                                                'underline',
                                                                        }}
                                                                    >
                                                                        use
                                                                        dynamic
                                                                        values
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </fieldset>
                                                </ShouldRender>
                                                <fieldset className="Margin-bottom--16">
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="incidentDescription"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            >
                                                                <span>
                                                                    Incident
                                                                    Description
                                                                </span>
                                                            </label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                    }}
                                                                >
                                                                    <Field
                                                                        component={
                                                                            RenderTextArea
                                                                        }
                                                                        name="incidentDescription"
                                                                        type="textarea"
                                                                        rows="5"
                                                                        placeholder="Description of the incident"
                                                                        id="incidentDescription"
                                                                        className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                        style={{
                                                                            width:
                                                                                '100%',
                                                                            padding:
                                                                                '3px 5px',
                                                                            whiteSpace:
                                                                                'normal',
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                                {customFields &&
                                                    customFields.length > 0 &&
                                                    customFields.map(
                                                        (field, index) => (
                                                            <fieldset
                                                                key={index}
                                                                className="Margin-bottom--16"
                                                            >
                                                                <div className="bs-Fieldset-rows">
                                                                    <div
                                                                        className="bs-Fieldset-row"
                                                                        style={{
                                                                            padding: 0,
                                                                        }}
                                                                    >
                                                                        <label
                                                                            className="bs-Fieldset-label Text-align--left"
                                                                            htmlFor="incidentDescription"
                                                                            style={{
                                                                                flexBasis:
                                                                                    '20%',
                                                                            }}
                                                                        >
                                                                            <span>
                                                                                {
                                                                                    field.fieldName
                                                                                }
                                                                            </span>
                                                                        </label>
                                                                        <div
                                                                            className="bs-Fieldset-fields"
                                                                            style={{
                                                                                flexBasis:
                                                                                    '80%',
                                                                                maxWidth:
                                                                                    '80%',
                                                                            }}
                                                                        >
                                                                            <div
                                                                                className="bs-Fieldset-field"
                                                                                style={{
                                                                                    width:
                                                                                        '100%',
                                                                                }}
                                                                            >
                                                                                <Field
                                                                                    component={
                                                                                        RenderField
                                                                                    }
                                                                                    name={
                                                                                        field.fieldName
                                                                                    }
                                                                                    id={
                                                                                        field.fieldName
                                                                                    }
                                                                                    type={
                                                                                        field.fieldType
                                                                                    }
                                                                                    className="db-BusinessSettings-input TextInput bs-TextInput"
                                                                                    style={{
                                                                                        width:
                                                                                            '100%',
                                                                                        padding:
                                                                                            '3px 5px',
                                                                                        whiteSpace:
                                                                                            'normal',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </fieldset>
                                                        )
                                                    )}
                                                <fieldset
                                                    style={{
                                                        paddingTop: 0,
                                                    }}
                                                >
                                                    <div className="bs-Fieldset-rows">
                                                        <div
                                                            className="bs-Fieldset-row"
                                                            style={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            <label
                                                                className="bs-Fieldset-label Text-align--left"
                                                                htmlFor="name"
                                                                style={{
                                                                    flexBasis:
                                                                        '20%',
                                                                }}
                                                            ></label>
                                                            <div
                                                                className="bs-Fieldset-fields"
                                                                style={{
                                                                    flexBasis:
                                                                        '80%',
                                                                    maxWidth:
                                                                        '80%',
                                                                }}
                                                            >
                                                                <div
                                                                    className="bs-Fieldset-field"
                                                                    style={{
                                                                        width:
                                                                            '100%',
                                                                        display:
                                                                            'block',
                                                                    }}
                                                                >
                                                                    {formValues &&
                                                                        !formValues.showAvailableVariables && (
                                                                            <div
                                                                                style={{
                                                                                    width:
                                                                                        '100%',
                                                                                    paddingBottom: 10,
                                                                                    textDecoration:
                                                                                        'underline',
                                                                                    cursor:
                                                                                        'pointer',
                                                                                }}
                                                                                onClick={
                                                                                    this
                                                                                        .toggleShowAvailableVariables
                                                                                }
                                                                            >
                                                                                Click
                                                                                to
                                                                                show
                                                                                available
                                                                                variables
                                                                            </div>
                                                                        )}
                                                                    {formValues &&
                                                                        formValues.showAvailableVariables && (
                                                                            <div>
                                                                                <span
                                                                                    className="template-variable-2"
                                                                                    style={{
                                                                                        display:
                                                                                            'block',
                                                                                        paddingBottom:
                                                                                            '10px',
                                                                                    }}
                                                                                >
                                                                                    You
                                                                                    can
                                                                                    use
                                                                                    these
                                                                                    available
                                                                                    variables
                                                                                    in
                                                                                    incident
                                                                                    title,
                                                                                    incident
                                                                                    description
                                                                                    or
                                                                                    custom
                                                                                    field.
                                                                                </span>
                                                                                <span
                                                                                    className="template-variable-1"
                                                                                    style={{
                                                                                        display:
                                                                                            'block',
                                                                                    }}
                                                                                >
                                                                                    {incomingRequestVariables.map(
                                                                                        (
                                                                                            item,
                                                                                            index
                                                                                        ) => {
                                                                                            return (
                                                                                                <span
                                                                                                    key={
                                                                                                        index
                                                                                                    }
                                                                                                    className="template-variables"
                                                                                                    style={
                                                                                                        bulletpoints
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        item.description
                                                                                                    }
                                                                                                    <br />
                                                                                                </span>
                                                                                            );
                                                                                        }
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </fieldset>
                                            </>
                                        )}
                                </div>
                            </div>
                            <div className="bs-Modal-footer">
                                <div className="bs-Modal-footer-actions">
                                    <ShouldRender
                                        if={
                                            !this.props.requesting &&
                                            this.props.requestError
                                        }
                                    >
                                        <div
                                            className="bs-Tail-copy"
                                            style={{ width: 200 }}
                                        >
                                            <div
                                                className="Box-root Flex-flex Flex-alignItems--stretch Flex-direction--row Flex-justifyContent--flexStart"
                                                style={{ marginTop: '10px' }}
                                            >
                                                <div className="Box-root Margin-right--8">
                                                    <div className="Icon Icon--info Icon--color--red Icon--size--14 Box-root Flex-flex"></div>
                                                </div>
                                                <div className="Box-root">
                                                    <span
                                                        style={{ color: 'red' }}
                                                    >
                                                        {
                                                            this.props
                                                                .requestError
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </ShouldRender>
                                    <button
                                        className="bs-Button bs-DeprecatedButton btn__modal"
                                        type="button"
                                        onClick={() => {
                                            this.props.destroy();
                                            closeModal({ id: projectId });
                                        }}
                                    >
                                        <span>Cancel</span>
                                        <span className="cancel-btn__keycode">
                                            Esc
                                        </span>
                                    </button>
                                    <button
                                        className="bs-Button bs-DeprecatedButton bs-Button--blue btn__modal"
                                        disabled={this.props.requesting}
                                        type="submit"
                                        id="createIncomingRequest"
                                    >
                                        {!this.props.requesting && (
                                            <>
                                                <span>Create</span>
                                                <span className="create-btn__keycode">
                                                    <span className="keycode__icon keycode__icon--enter" />
                                                </span>
                                            </>
                                        )}
                                        {this.props.requesting && (
                                            <FormLoader />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

CreateIncomingRequest.displayName = 'CreateIncomingRequest';

CreateIncomingRequest.propTypes = {
    closeModal: PropTypes.func.isRequired,
    openModal: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    monitors: PropTypes.array,
    createIncomingRequest: PropTypes.func,
    requesting: PropTypes.bool,
    requestError: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined]),
    ]),
    formValues: PropTypes.object,
    data: PropTypes.object,
    incidentPriorities: PropTypes.array,
    destroy: PropTypes.func.isRequired, // to manually destroy the form state
    change: PropTypes.func.isRequired, // to manually change redux form state
    fetchCustomFields: PropTypes.func,
    customFields: PropTypes.array,
    fetchMonitorCustomFields: PropTypes.func,
    monitorCustomFields: PropTypes.array,
};

const CreateIncomingRequestForm = reduxForm({
    form: 'incomingRequestForm', // a unique identifier for this form
    enableReinitialize: false,
    validate, // <--- validation function given to redux-form
    destroyOnUnmount: false,
})(CreateIncomingRequest);

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            createIncomingRequest,
            closeModal,
            openModal,
            fetchCustomFields,
            fetchMonitorCustomFields,
        },
        dispatch
    );

const mapStateToProps = (state, ownProps) => {
    const monitorData = state.monitor.monitorsList.monitors.find(
        data => String(data._id) === String(ownProps.data.projectId)
    );
    const monitors = monitorData ? monitorData.monitors : [];

    return {
        monitors,
        requesting: state.incomingRequest.createIncomingRequest.requesting,
        requestError: state.incomingRequest.createIncomingRequest.error,
        formValues:
            state.form.incomingRequestForm &&
            state.form.incomingRequestForm.values,
        initialValues: {
            isDefault: false,
            incidentPriority:
                state.incidentBasicSettings.incidentBasicSettings
                    .incidentPriority,
            showAdvancedOptions: false,
            showAvailableVariables: false,
            incidentType: 'offline',
            noteContent: '',
            incidentState: 'update',
        },
        incidentPriorities:
            state.incidentPriorities.incidentPrioritiesList.incidentPriorities,
        customFields: state.customField.customFields.fields,
        monitorCustomFields:
            state.monitorCustomField.monitorCustomFields.fields,
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CreateIncomingRequestForm);
