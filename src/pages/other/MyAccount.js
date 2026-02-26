import PropTypes from "prop-types";
import React, { Fragment, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import Card from "react-bootstrap/Card";
import Accordion from "react-bootstrap/Accordion";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { useForm } from "react-hook-form";
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { setLoader } from "../../redux/actions/loaderActions";
import { useToasts } from "react-toast-notifications";
import { connect } from "react-redux";
import { getState, getCountry, getShippingState } from "../../redux/actions/userAction";
import { multilanguage } from "redux-multilanguage";
import SweetAlert from 'react-bootstrap-sweetalert';
import { deleteAllFromCart } from "../../redux/actions/cartActions";
import { setUser } from "../../redux/actions/userAction";
import { setLocalData } from '../../util/helper';
import AddressList from "../../components/address/AddressList";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../../redux/actions/addressActions";
const changePasswordForm = {
  userName: {
    name: "userName",
    validate: {
      required: {
        value: true,
        message: "User Name is required"
      }
    }
  },
  currentPassword: {
    name: "currentPassword",
    validate: {
      required: {
        value: true,
        message: "Current Password is required"
      }
    }
  },
  password: {
    name: "password",
    validate: {
      required: {
        value: true,
        message: "Password is required"
      },
      validate: {
        hasSpecialChar: (value) => (value && value.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/)) || 'Password must be minimum of 8 characters atleast one number and one special character'
      }
    }
  },
  repeatPassword: {
    name: "repeatPassword",
    validate: {
      required: {
        value: true,
        message: "Repeat Password is required"
      }
    }
  }
}

const accountForm = {
  username: {
    name: "username",
    validate: {
      required: {
        value: true,
        message: "User Name is required"
      }
    }
  },
  email: {
    name: "email",
    validate: {
      required: {
        value: true,
        message: "Email is required"
      },
      pattern: {
        value: /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i,
        message: 'Please entered the valid email id'
      }
    }
  }
}


const MyAccount = ({ language, setUser, deleteAllFromCart, merchant, strings, location, setLoader, getState, getCountry, getShippingState, countryData, stateData, shipStateData, userData, addresses, getAddresses, createAddress, updateAddress, deleteAddress }) => {
  const { pathname } = location;
  const { addToast } = useToasts();
  const history = useHistory();
  const [isDeleted, setIsDeleted] = useState(false)
  const { register, handleSubmit, errors, watch, setError, clearErrors, reset } = useForm({
    mode: "onChange",
    criteriaMode: "all"
  });


  const {
    register: accountRef,
    errors: accountErr,
    handleSubmit: accountSubmit,
    // control: accountControl,
    setValue: setAccountValue,
    // watch: deliveryWatch,
  } = useForm({
    mode: "onChange"
  });

  useEffect(() => {
    getState()
    getCountry()
    getShippingState()
    getAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const onChangePassword = async (data) => {
    setLoader(true)
    try {
      let action = constant.ACTION.CUSTOMER + constant.ACTION.PASSWORD;
      let param = {
        "password": data.password,
        "repeatPassword": data.repeatPassword,
        "current": data.currentPassword,
        "username": data.userName,
      }
      let response = await WebService.post(action, param);
      if (response) {
        reset({})
        addToast("Your password has been changed successfully!", { appearance: "success", autoDismiss: true });
      }
      setLoader(false)
    } catch (error) {
      addToast("Your current password is wrong", { appearance: "error", autoDismiss: true });
      setLoader(false)
    }
  }
  const onConfirmPassword = (e) => {
    if (watch('password') !== e.target.value) {
      return setError(
        changePasswordForm.repeatPassword.name,
        {
          type: "notMatch",
          message: "Repeat Password should be the same as a password"
        }
      );
    }

  }
  const onPasswordChange = (e) => {
    if (watch('repeatPassword') !== '' && watch('repeatPassword') !== e.target.value) {
      return setError(
        changePasswordForm.repeatPassword.name,
        {
          type: "notMatch",
          message: "Repeat Password should be the same as a password"
        }
      );

    } else {
      clearErrors(changePasswordForm.repeatPassword.name);
    }

  }



  const onChangeAccount = async (data) => {
    setLoader(true)
    try {
      let action = constant.ACTION.AUTH + constant.ACTION.CUSTOMER;
      let param = {
        emailAddress: data.email
      }
      // console.log(param);
      await WebService.patch(action, param);
      // if (response) {
      // reset({})
      addToast("Your account has been updated successfully.", { appearance: "success", autoDismiss: true });
      // }
      setLoader(false)
    } catch (error) {
      addToast("Your account has been updated fail.", { appearance: "error", autoDismiss: true });
      setLoader(false)
    }
  }
  const onDeleteConfirm = () => {
    console.log('confrim')
    setIsDeleted(!isDeleted)
  }
  const onDelete = async () => {
    onDeleteConfirm()
    setLoader(true)
    try {
      let action = constant.ACTION.AUTH + constant.ACTION.CUSTOMER;


      await WebService.delete(action);

      addToast("Your account has been deleted successfully.", { appearance: "success", autoDismiss: true });
      history.push('/login')
      setUser('')
      setLocalData('token', '')
      deleteAllFromCart()
      setLoader(false)
    } catch (error) {
      addToast("Your account has been deleted fail.", { appearance: "error", autoDismiss: true });
      setLoader(false)
    }
  }
  const handleAddAddress = async (addressData) => {
    await createAddress(addressData, addToast);
    await getAddresses();
  };

  const handleUpdateAddress = async (id, addressData) => {
    await updateAddress(id, addressData, addToast);
    await getAddresses();
  };

  const handleDeleteAddress = async (id) => {
    await deleteAddress(id, addToast);
  };

  return (
    <Fragment>
      <MetaTags>
        <title>{merchant.name} | {strings["My Account"]}</title>
        {/* <meta
          name="description"
          content="Compare page of flone react minimalist eCommerce template."
        /> */}
      </MetaTags>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
        {strings["My Account"]}
      </BreadcrumbsItem>
      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb />
        <div className="myaccount-area pb-80 pt-100">
          <div className="container">
            <div className="row">
              <div className="ml-auto mr-auto col-lg-9">
                <div className="myaccount-wrapper">
                  <Accordion defaultActiveKey="3">
                    <Card className="single-my-account mb-20">
                      <Card.Header className="panel-heading">
                        <Accordion.Toggle variant="link" eventKey="3">
                          <h3 className="panel-title">
                            <span>1 .</span> {strings["Your account"]}
                          </h3>
                        </Accordion.Toggle>
                      </Card.Header>
                      <Accordion.Collapse eventKey="3">
                        <Card.Body>
                          <div className="myaccount-info-wrapper">
                            <div className="account-info-wrapper">
                              <h4>{strings["Your account"]}</h4>
                            </div>
                            <form onSubmit={accountSubmit(onChangeAccount)}>
                              <div className="row">
                                <div className="col-lg-12 col-md-12">
                                  <div className="billing-info">
                                    <label>{strings["User Name"]}</label>
                                    <input type="text" name={accountForm.username.name} disabled ref={accountRef(accountForm.username.validate)} />
                                    {accountErr[accountForm.username.name] && <p className="error-msg">{errors[accountForm.username.name].message}</p>}
                                  </div>
                                </div>
                                <div className="col-lg-12 col-md-12">
                                  <div className="billing-info">
                                    <label>{strings["Email address"]}</label>
                                    <input type="text" name={accountForm.email.name} ref={accountRef(accountForm.email.validate)} />
                                    {accountErr[accountForm.email.name] && <p className="error-msg">{accountErr[accountForm.email.name].message}</p>}

                                  </div>
                                </div>
                              </div>

                              <div className="billing-back-btn">
                                <div className="billing-btn">
                                  <button type="submit">{strings["Continue"]}</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>

                    <Card className="single-my-account mb-20">
                      <Card.Header className="panel-heading">
                        <Accordion.Toggle variant="link" eventKey="0">
                          <h3 className="panel-title">
                            <span>2 .</span> {strings["Billing Address"]}{" "}
                          </h3>
                        </Accordion.Toggle>
                      </Card.Header>
                      <Accordion.Collapse eventKey="0">
                        <Card.Body>
                          <AddressList
                            addresses={addresses}
                            addressType="BILLING"
                            onAdd={handleAddAddress}
                            onUpdate={handleUpdateAddress}
                            onDelete={handleDeleteAddress}
                            strings={strings}
                            countryData={countryData}
                            stateData={stateData}
                            getState={getState}
                          />
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                    <Card className="single-my-account mb-20">
                      <Card.Header className="panel-heading">
                        <Accordion.Toggle variant="link" eventKey="1">
                          <h3 className="panel-title">
                            <span>3 .</span> {strings["Delivery Address"]}{" "}
                          </h3>
                        </Accordion.Toggle>
                      </Card.Header>
                      <Accordion.Collapse eventKey="1">
                        <Card.Body>
                          <AddressList
                            addresses={addresses}
                            addressType="DELIVERY"
                            onAdd={handleAddAddress}
                            onUpdate={handleUpdateAddress}
                            onDelete={handleDeleteAddress}
                            strings={strings}
                            countryData={countryData}
                            stateData={shipStateData}
                            getState={getShippingState}
                          />
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                    <Card className="single-my-account mb-20">
                      <Card.Header className="panel-heading">
                        <Accordion.Toggle variant="link" eventKey="2">
                          <h3 className="panel-title">
                            <span>4 .</span> {strings["Change your password"]}
                          </h3>
                        </Accordion.Toggle>
                      </Card.Header>
                      <Accordion.Collapse eventKey="2">
                        <Card.Body>
                          <div className="myaccount-info-wrapper">
                            <div className="account-info-wrapper">
                              <h4>{strings["Change Password"]}</h4>
                            </div>
                            <form onSubmit={handleSubmit(onChangePassword)}>
                              <div className="row">
                                <div className="col-lg-12 col-md-12">
                                  <div className="billing-info">
                                    <label>{strings["User Name"]}</label>
                                    <input type="text" name={changePasswordForm.userName.name} ref={register(changePasswordForm.userName.validate)} />
                                    {errors[changePasswordForm.userName.name] && <p className="error-msg">{errors[changePasswordForm.userName.name].message}</p>}
                                  </div>
                                </div>
                                <div className="col-lg-12 col-md-12">
                                  <div className="billing-info">
                                    <label>{strings["Current Password"]}</label>
                                    <input type="password" name={changePasswordForm.currentPassword.name} ref={register(changePasswordForm.currentPassword.validate)} />
                                    {errors[changePasswordForm.currentPassword.name] && <p className="error-msg">{errors[changePasswordForm.currentPassword.name].message}</p>}

                                  </div>
                                </div>
                                <div className="col-lg-12 col-md-12">
                                  <div className="billing-info">
                                    <label>{strings["Password"]}</label>
                                    <input type="password" onChange={(e) => onPasswordChange(e)} name={changePasswordForm.password.name} ref={register(changePasswordForm.password.validate)} />
                                    {errors[changePasswordForm.password.name] && <p className="error-msg">{errors[changePasswordForm.password.name].message}</p>}
                                  </div>
                                </div>
                                <div className="col-lg-12 col-md-12">
                                  <div className="billing-info">
                                    <label>{strings["Repeat Password"]}Repeat Password</label>
                                    <input type="password" onChange={(e) => onConfirmPassword(e)} name={changePasswordForm.repeatPassword.name} ref={register(changePasswordForm.repeatPassword.validate)} />
                                    {errors[changePasswordForm.repeatPassword.name] && <p className="error-msg">{errors[changePasswordForm.repeatPassword.name].message}</p>}
                                  </div>
                                </div>
                              </div>

                              <div className="billing-back-btn">
                                <div className="billing-btn">
                                  <button type="submit">{strings["Continue"]}</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                    <Card className="single-my-account mb-20">
                      <Card.Header className="panel-heading">
                        {/* */}
                        <Accordion.Toggle variant="link" eventKey="6">
                          <h3 className="panel-title">
                            <span>5 .</span> {strings["Account Management"]}
                          </h3>
                        </Accordion.Toggle>
                      </Card.Header>
                      <Accordion.Collapse eventKey="4">
                        <Card.Body>
                          <div className="myaccount-info-wrapper">
                            {/* <div className="account-info-wrapper">
                              <h4>{strings["Your account"]}</h4>
                            </div> */}
                            <form>
                              {/* <div className="row">
                                <div className="col-lg-12 col-md-12">
                                  <button type="button" onClick={onDeleteConfirm} className="delete_account">
                                    <span className="label">{strings["Delete your account"]}</span>
                                  </button>
                                </div>

                              </div> */}
                              <div className="account-management">
                                <div className="delete-btn">
                                  <button type="button" onClick={onDeleteConfirm} >{strings["Delete your account"]}</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>

        </div>
        {
          isDeleted &&
          <SweetAlert
            showCancel
            cancelBtnBsStyle="light"
            confirmBtnText="Yes, delete it!"
            confirmBtnBsStyle="danger"
            onConfirm={onDelete}
            onCancel={onDeleteConfirm}
            title="Are you sure?"
          >
            Are you sure that you want to permanently delete this account
        </SweetAlert>
        }
      </Layout>
    </Fragment >
  );
};

MyAccount.propTypes = {
  location: PropTypes.object
};
const mapStateToProps = (state) => {
  return {
    countryData: state.userData.country,
    language: state.multilanguage.currentLanguageCode,
    userData: state.userData.userData,
    // cartItems: state.cartData.cartItems,
    // currentLocation: state.userData.currentAddress,
    stateData: state.userData.state,
    shipStateData: state.userData.shipState,
    merchant: state.merchantData.merchant,
    addresses: state.addressData.addresses
    // defaultStore: state.merchantData.defaultStore,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLoader: (value) => {
      dispatch(setLoader(value));
    },
    setUser: (data) => {
      dispatch(setUser(data));
    },
    deleteAllFromCart: () => {
      dispatch(deleteAllFromCart())
    },
    getState: (code) => {
      dispatch(getState(code));
    },
    getCountry: (language) => {
      dispatch(getCountry(language));
    },
    getShippingState: (code) => {
      dispatch(getShippingState(code));
    },
    getAddresses: () => dispatch(getAddresses()),
    createAddress: (data, toast) => dispatch(createAddress(data, toast)),
    updateAddress: (id, data, toast) => dispatch(updateAddress(id, data, toast)),
    deleteAddress: (id, toast) => dispatch(deleteAddress(id, toast))
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(MyAccount));

  // export default MyAccount;
