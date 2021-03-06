import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { arrayMove } from 'react-sortable-hoc';
import shortId from 'short-id';

import { Button } from '../styledComponents/theme';
import { Heading2 } from '../styledComponents/typography';
import NewForm from '../components/NewForm/index';

const CreateButton = Button.extend`
  background-image: linear-gradient(19deg, #21d4fd 0%, #b721ff 100%);
  margin-left: 20px;
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const TitleContainer = styled.div`
  display: inline-flex;
  width: 350px;
  flex-direction: column;
  margin-bottom: 30px;
`;

const TitleLabel = styled.label`
  font-weight: bold;
`;

const TitleInput = styled.input`
  color: black;
  font-size: 18px;
`;

class NewFormPage extends Component {
  static contextTypes = {
    firebase: PropTypes.object,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    uid: PropTypes.string,
    signIn: PropTypes.func.isRequired,
  };

  state = {
    title: '',
    fields: [],
    loading: false,
  };

  // to keep track of what item is being edited
  editing = null;

  handleKeydown = e => {
    if (e.which === 27) this.handleToggleEdit(this.editing);
    if (e.which === 13) this.handleAddItem();
  };

  handleToggleEdit = id => {
    this.setState(prevState => {
      const fields = prevState.fields
        .filter(({ text }) => text)
        .map(field => {
          if (field.id === id) {
            if (!field.editing) {
              this.editing = id;
            } else {
              this.editing = null;
            }

            return {
              ...field,
              editing: !field.editing,
            };
          }

          return {
            ...field,
            editing: false,
          };
        });

      return {
        ...prevState,
        fields,
      };
    });
  };

  handleTitleChange = e => {
    const { value } = e.target;

    this.setState({
      title: value,
    });
  };

  handleTextChange = (e, id) => {
    const fields = this.state.fields.map(field => {
      if (field.id === id) {
        return {
          ...field,
          text: e.target.value,
        };
      }

      return field;
    });

    this.setState({
      ...this.state,
      fields,
    });
  };

  handleSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      ...this.state,
      fields: arrayMove(this.state.fields, oldIndex, newIndex),
    });
  };

  handleAddItem = () => {
    // if the user spams add w/o writing any text the items w/o any text get removed
    const fields = this.state.fields
      // filter out any falsy values from the list
      .filter(Boolean)
      .filter(({ text }) => !!text.trim())
      .map(field => ({
        ...field,
        editing: false,
      }));
    const id = shortId.generate();
    this.editing = id;

    this.setState({
      ...this.state,
      fields: [
        ...fields,
        {
          id,
          text: '',
          editing: true,
        },
      ],
    });
  };

  handleDelete = id => {
    const fields = this.state.fields.filter(field => field.id !== id);

    this.setState({
      ...this.state,
      fields,
    });
  };

  handleCreate = () => {
    const formId = shortId.generate();
    const { signIn, uid } = this.props;

    this.setState({
      loading: true,
    });

    if (!uid) {
      // due to our database rules, we can't write unless a uid exists
      signIn('anonymous').then(() => {
        this.createForm(formId);
      });
    } else {
      this.createForm(formId);
    }
  };

  createForm(formId) {
    const { firebase } = this.context;
    const { fields, title } = this.state;
    const { history } = this.props;

    firebase.forms
      .doc(formId)
      .set({
        title,
        id: formId,
        fields: fields.map(({ text, id }) => ({ text, fieldId: id })),
      })
      .then(() => {
        this.setState({
          fields: [],
          loading: false,
          title: '',
        });

        history.push(`/form/${formId}`);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error);
        // TODO: notify the user of the error
      });
  }

  render() {
    const { fields, loading, title } = this.state;
    const fieldsWithText = fields.filter(({ text }) => !!text.trim());
    const disableCreate = !title || fieldsWithText.length < 2 || loading;

    return (
      <div>
        <Heading2>Create a new Form</Heading2>
        <TitleContainer>
          <TitleLabel htmlFor="newFormTitle">Title</TitleLabel>
          <TitleInput
            id="newFormTitle"
            value={title}
            onChange={this.handleTitleChange}
          />
        </TitleContainer>
        <NewForm
          fields={fields}
          onToggleEdit={this.handleToggleEdit}
          onTextChange={this.handleTextChange}
          onKeyDown={this.handleKeydown}
          onSortEnd={this.handleSortEnd}
          onDelete={this.handleDelete}
        />
        <ActionContainer>
          <Button
            disabled={disableCreate}
            onClick={!disableCreate && this.handleCreate}>
            {loading ? 'Creating...' : 'Create'}
          </Button>

          <CreateButton
            disabled={loading}
            onClick={!loading && this.handleAddItem}>
            Add
          </CreateButton>
        </ActionContainer>
      </div>
    );
  }
}

export default NewFormPage;
