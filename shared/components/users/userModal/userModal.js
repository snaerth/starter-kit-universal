import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// Components
import ViewUser from '../viewUser';
import UserForm from '../userForm';
import Banner from '../../common/banner';
import Delete from '../../common/delete';
// Styles
import s from './userModal.scss';

class UserModal extends Component {
  static propTypes = {
    activeView: PropTypes.string,
    data: PropTypes.object,
    name: PropTypes.string.isRequired,
    deleteHandler: PropTypes.func,
    closeModalHandler: PropTypes.func.isRequired,
  };

  static defaultProps = {
    activeView: 'view',
  };

  constructor(props) {
    super(props);

    this.state = {
      views: ['view', 'delete', 'edit'],
      activeView: props.activeView,
    };

    this.changeView = this.changeView.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return !!nextProps.data;
  }

  /**
   * Changes the activeView state for views
   * @param {Number} viewId
   */
  changeView(viewId) {
    if (viewId !== null) {
      this.setState(() => ({
        activeView: this.state.views[viewId],
      }));
    } else {
      this.props.closeModalHandler();
    }
  }

  /**
   * Changes witch component should render
   */
  setView() {
    const { activeView } = this.state;
    const { data, deleteHandler } = this.props;

    switch (activeView) {
      case 'view':
        return <ViewUser data={data} changeViewHandler={this.changeView} />;

      case 'delete':
        return (
          <Delete
            text={`Do you really want to delete ${data.name}`}
            deleteButtonText="Delete user"
            deleteHandler={deleteHandler}
            deleteHandlerId={data.id} // eslint-disable-line
            cancelHandler={this.changeView}
            cancelHandlerId={0}
          />
        );

      case 'profile':
      case 'edit':
        return <UserForm type={activeView} user={data} changeViewHandler={this.changeView} />;

      case 'create':
        return <UserForm type={activeView} user={{}} changeViewHandler={this.changeView} />;

      default:
        return <ViewUser data={data} changeViewHandler={this.changeView} />;
    }
  }

  /**
   * Sets header title text
   *
   * @param {String} type
   * @param {String} name
   * @returns {String}
   */
  setHeaderTitle(type, name) {
    switch (type) {
      case 'edit':
        return 'Edit user';

      case 'create':
        return 'Create user';

      default:
        return name;
    }
  }

  render() {
    const { activeView } = this.state;
    const { name } = this.props;

    return (
      <article className={s.modal}>
        <header>
          <Banner text={this.setHeaderTitle(activeView, name)} />
        </header>
        {this.setView()}
      </article>
    );
  }
}

/**
 * Maps state to components props
 *
 * @param {Object} state - Application state
 * @param {Object} ownProps - Components own props
 * @returns {Object}
 */
function mapStateToProps(state, ownProps) {
  if (ownProps.activeView === 'profile') {
    const { user } = state.auth;
    return { data: user, name: user.name };
  }

  const { user } = state.users;
  if (user) {
    return { data: user, name: user.name };
  }

  return { data: {}, name: 'Create User' };
}

export default connect(mapStateToProps)(UserModal);
