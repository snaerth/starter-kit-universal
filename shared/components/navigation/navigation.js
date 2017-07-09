import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './navigation.scss';

export default class Navigation extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  /**
   * Renders each navigation item
   * @param {*} component
   * @param {Int} index
   * @param {Object} styles
   * @returns {Jsx}
   */
  renderItem(component, index, { item, link, left }) {
    return (
      <li className={classnames(item, index === 0 ? left : '')}>
        {React.cloneElement(component, {
          className: link,
        })}
      </li>
    );
  }

  render() {
    const { nav, list, item, link, left } = styles;

    return (
      <nav className={nav}>
        <ul className={list}>
          {React.Children.map(this.props.children, (component, index) =>
            this.renderItem(component, index, { item, link, left }),
          )}
        </ul>
      </nav>
    );
  }
}