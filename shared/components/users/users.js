import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// Components
import * as actionCreators from './actions';
import UsersTable from './userTable';
import UsersModal from './userModal';
import SearchBar from '../common/searchBar';
import Loader from '../common/loader';
import NotifyBox from '../common/notifyBox';
import ModalWrapper from '../common/modal';
import Pagination from '../common/pagination';
import Card from '../common/card';
import CircleButton from '../common/circleButton';
// Utils
import createPagination from '../../utils/pagination';
import { formDataToQueryString } from '../../utils/urlHelpers';
// Svg
import AddIcon from '../../assets/images/add.svg';
// Styles
import tableStyles from '../../styles/table.css';
import s from './users.scss';

class Users extends Component {
  static propTypes = {
    token: PropTypes.string.isRequired,
    actions: PropTypes.object.isRequired,
    data: PropTypes.object,
    isFetching: PropTypes.bool.isRequired,
    error: PropTypes.string,
    pagination: PropTypes.object.isRequired,
    change: PropTypes.func,
    reset: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      modalOpen: false,
      formData: { limit: 100, page: 1 },
      sortBy: null,
      activeView: 'view',
    };

    this.rowClassName = this.rowClassName.bind(this);
    this.onRowClickHandler = this.onRowClickHandler.bind(this);
    this.onSortClickHandler = this.onSortClickHandler.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.paginateHandler = this.paginateHandler.bind(this);
    this.deleteHandler = this.deleteHandler.bind(this);
    this.openCreateUserModal = this.openCreateUserModal.bind(this);
  }

  /**
   * Fetch users
   */
  componentDidMount() {
    this.props.actions.isFetchingData();
    const { token } = this.props;
    const { formData } = this.state;
    const queryString = formDataToQueryString(formData);
    this.props.actions.getUsers({ token, queryString });
  }

  /**
   * Opens modal and sets create view
   *
   * @param {Object} event
   */
  openCreateUserModal(event) {
    event.preventDefault();
    this.props.actions.unsetUser();
    this.setState(() => ({
      modalOpen: true,
      activeView: 'create',
    }));
  }

  /**
   * Sets style to even and odd rows
   *
   * @param {index} param0
   * @returns {string} className
   */
  rowClassName({ index }) {
    if (index < 0) {
      return tableStyles.headerRow;
    }
    return index % 2 === 0 ? tableStyles.tableEvenRow : tableStyles.tableOddRow;
  }

  /**
   * Set new state open modal and set current row data for modal
   *
   * @param {Object} event
   * @param {Number} index
   * @param {Object} rowData
   */
  onRowClickHandler(event, index, rowData) {
    this.props.actions.setUser(rowData);
    this.setState({
      modalOpen: true,
    });
  }

  /**
   * Sort handler for table sorting
   *
   * @param {String} sortBy
   * @param {String} sortDirection
   */
  onSortClickHandler(sortBy, sortDirection) {
    const currentSortBy = {};
    currentSortBy[sortBy] = sortDirection;
    this.setState({
      sortBy: currentSortBy,
    });
  }

  /**
   * Set state to close modal and reset current row data
   */
  closeModal() {
    this.setState(() => ({
      modalOpen: false,
      activeView: 'view',
    }));
  }

  /**
   * Changes current page state and submits
   *
   * @param  {Object} data
   */
  paginateHandler(data) {
    const formData = { ...this.state.formData };
    formData.page = data.selected + 1;
    this.setState(() => ({ formData }));
  }

  /**
   * Delete handler to delete user
   *
   * @param  {String} id
   */
  async deleteHandler(id) {
    const { actions, token } = this.props;
    const queryString = formDataToQueryString(this.state.formData);
    this.closeModal();
    await actions.deleteUserById(this.props.token, id);
    actions.getUsers({ token, queryString });
  }

  /**
   * Renders error message box
   *
   * @param {String} error
   * @returns {JSX}
   */
  renderError(error) {
    return (
      <fieldset className="noPadding">
        <NotifyBox strongText="Error: " text={error} type="error" />
      </fieldset>
    );
  }

  render() {
    const {
      data,
      isFetching,
      error,
      pagination,
      reset,
      change,
      actions: { getUsersBySearchQuery, getUsers, isFetchingData },
    } = this.props;

    const {
      activeView, modalOpen, formData, sortBy,
    } = this.state;

    return (
      <Card>
        {error ? this.renderError(error) : null}
        <div className={s.minHeight200}>
          {isFetching ? <Loader absolute>Getting users...</Loader> : null}
          {data ? (
            <div className={isFetching ? 'almostHidden' : ''}>
              <SearchBar
                submitCallback={this.submitCallback}
                reset={reset}
                change={change}
                query={getUsersBySearchQuery}
                get={getUsers}
                isFetchingData={isFetchingData}
                formData={formData}
                sortBy={sortBy}
                searchPlaceholder="Search users..."
              />
              <UsersTable
                list={data.docs}
                onRowClickHandler={this.onRowClickHandler}
                onSortClickHandler={this.onSortClickHandler}
                rowClassName={this.rowClassName}
              />
              <Pagination
                pageCount={pagination.pages || 1}
                initialPage={pagination.page || 1}
                onPageChangeHandler={this.paginateHandler}
              />
            </div>
          ) : null}
        </div>
        <div className={s.createButton}>
          <CircleButton onClick={(e) => this.openCreateUserModal(e)}>
            <AddIcon />
          </CircleButton>
        </div>
        {modalOpen ? (
          <ModalWrapper
            className="mw992"
            isOpen={modalOpen}
            onRequestClose={this.closeModal}
            contentLabel="User modal"
            exitIconClassName="white"
          >
            <UsersModal
              deleteHandler={this.deleteHandler}
              activeView={activeView}
              closeModalHandler={this.closeModal}
            />
          </ModalWrapper>
        ) : null}
      </Card>
    );
  }
}

/**
 * Maps state to components props
 *
 * @param {Object} state - Application state
 * @returns {Object}
 */
function mapStateToProps(state) {
  const {
    users: {
      error, isFetching, data, user,
    }, auth,
  } = state;
  const token = auth && auth.user ? auth.user.token : '';
  let pagination = {};

  if (data) {
    const {
      limit, page, pages, total,
    } = data;
    pagination = createPagination({
      limit,
      pages,
      page,
      total,
    });
  }

  return {
    error,
    isFetching,
    token,
    data,
    pagination,
    user,
  };
}

/**
 * Maps dispatch to components props
 *
 * @param {Object} dispatch - Redux dispatch medhod
 * @returns {Object}
 */
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actionCreators, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);
