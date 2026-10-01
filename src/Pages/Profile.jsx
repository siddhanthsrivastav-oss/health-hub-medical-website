import { useEffect, useState } from 'react'
import { ArrowLeft, Check, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

const emptyAddress = {
    label: 'Home',
    name: '',
    phone: '',
    addressLine: '',
    landmark: '',
    pincode: '',
    city: '',
    isDefault: false
}

const Profile = () => {
    const apiUrl = import.meta.env.VITE_API_URL
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [addresses, setAddresses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [profileForm, setProfileForm] = useState({ name: '', email: '' })
    const [addressForm, setAddressForm] = useState(null)
    const [editingAddressId, setEditingAddressId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [notice, setNotice] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${apiUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
        }).then(({ data }) => {
            const customer = data.user
            setProfile(customer)
            setAddresses(customer.addresses || [])
            setProfileForm({ name: customer.name || '', email: customer.email || '' })
        }).catch((error) => {
            if (!axios.isCancel(error)) {
                setErrorMessage(error.response?.data?.message || 'Could not load your profile.')
            }
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoading(false)
        })

        return () => controller.abort()
    }, [apiUrl, token])

    const saveProfile = async (event) => {
        event.preventDefault()
        setIsSaving(true)
        setErrorMessage('')
        setNotice('')
        try {
            const { data } = await axios.patch(
                `${apiUrl}/api/user/profile`,
                profileForm,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setProfile(data.user)
            setProfileForm({ name: data.user.name || '', email: data.user.email || '' })
            localStorage.setItem('user', JSON.stringify(data.user))
            setIsEditingProfile(false)
            setNotice('Profile details updated.')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not update your profile.')
        } finally {
            setIsSaving(false)
        }
    }

    const saveAddress = async (event) => {
        event.preventDefault()
        setIsSaving(true)
        setErrorMessage('')
        setNotice('')
        const endpoint = editingAddressId
            ? `${apiUrl}/api/user/addresses/${editingAddressId}`
            : `${apiUrl}/api/user/addresses`
        const method = editingAddressId ? 'put' : 'post'

        try {
            const { data } = await axios[method](
                endpoint,
                addressForm,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setProfile(data.user)
            setAddresses(data.user.addresses || [])
            localStorage.setItem('user', JSON.stringify(data.user))
            setAddressForm(null)
            setEditingAddressId(null)
            setNotice(editingAddressId ? 'Address updated.' : 'Address saved to your profile.')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not save this address.')
        } finally {
            setIsSaving(false)
        }
    }

    const openNewAddress = () => {
        setEditingAddressId(null)
        setAddressForm({ ...emptyAddress, name: profile?.name || '', phone: profile?.phone || '' })
        setErrorMessage('')
        setNotice('')
    }

    const openEditAddress = (address) => {
        setEditingAddressId(address._id)
        setAddressForm({ ...emptyAddress, ...address })
        setErrorMessage('')
        setNotice('')
    }

    const setDefaultAddress = async (addressId) => {
        setErrorMessage('')
        setNotice('')
        try {
            const { data } = await axios.patch(
                `${apiUrl}/api/user/addresses/${addressId}/default`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setProfile(data.user)
            setAddresses(data.user.addresses || [])
            localStorage.setItem('user', JSON.stringify(data.user))
            setNotice('Default delivery address updated.')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not update the default address.')
        }
    }

    const deleteAddress = async (addressId) => {
        if (!window.confirm('Remove this saved address?')) return
        setErrorMessage('')
        setNotice('')
        try {
            const { data } = await axios.delete(
                `${apiUrl}/api/user/addresses/${addressId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setProfile(data.user)
            setAddresses(data.user.addresses || [])
            localStorage.setItem('user', JSON.stringify(data.user))
            setNotice('Address removed.')
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not remove this address.')
        }
    }

    if (isLoading) return <main className="profile-state">Loading your profile...</main>

    return (
        <main className="profile-page">
            <header className="profile-header">
                <div>
                    <button type="button" className="profile-back" onClick={() => navigate('/')}>
                        <ArrowLeft size={18} aria-hidden="true" /> Back to store
                    </button>
                    <h1>My Profile</h1>
                    <p>Manage your account and delivery addresses.</p>
                </div>
                <button type="button" className="profile-primary-button" onClick={openNewAddress}>
                    <Plus size={18} aria-hidden="true" /> Add address
                </button>
            </header>

            {errorMessage && <p className="profile-message profile-error" role="alert">{errorMessage}</p>}
            {notice && <p className="profile-message profile-success" role="status">{notice}</p>}

            <section className="profile-section" aria-labelledby="profile-personal-heading">
                <div className="profile-section-heading">
                    <div>
                        <h2 id="profile-personal-heading">Personal details</h2>
                        <p>Your account contact information.</p>
                    </div>
                    {!isEditingProfile && (
                        <button type="button" className="profile-secondary-button" onClick={() => setIsEditingProfile(true)}>
                            <Pencil size={16} aria-hidden="true" /> Edit details
                        </button>
                    )}
                </div>

                {isEditingProfile ? (
                    <form className="profile-form profile-personal-form" onSubmit={saveProfile}>
                        <label>Full name
                            <input required maxLength={100} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
                        </label>
                        <label>Email address <span className="profile-optional">Optional</span>
                            <input type="email" autoComplete="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
                        </label>
                        <label>Verified mobile number
                            <input value={`+91 ${profile?.phone || ''}`} readOnly />
                        </label>
                        <div className="profile-form-actions">
                            <button type="button" className="profile-secondary-button" onClick={() => setIsEditingProfile(false)}><X size={16} aria-hidden="true" /> Cancel</button>
                            <button type="submit" className="profile-primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
                        </div>
                    </form>
                ) : (
                    <dl className="profile-fields">
                        <div><dt>Full name</dt><dd>{profile?.name || 'Not added'}</dd></div>
                        <div><dt>Mobile number</dt><dd>{profile?.phone ? `+91 ${profile.phone}` : 'Not added'}</dd></div>
                        <div><dt>Email address</dt><dd>{profile?.email || 'Not added'}</dd></div>
                    </dl>
                )}
            </section>

            <section className="profile-section" aria-labelledby="profile-address-heading">
                <div className="profile-section-heading">
                    <div>
                        <h2 id="profile-address-heading">Saved addresses <span className="profile-count">{addresses.length}</span></h2>
                        <p>Choose a default address or manage multiple delivery locations.</p>
                    </div>
                </div>

                {addresses.length ? (
                    <div className="profile-address-list">
                        {addresses.map((address) => (
                            <article className={`profile-address-card ${address.isDefault ? 'is-default' : ''}`} key={address._id}>
                                <div className="profile-address-card-top">
                                    <div className="profile-address-label">
                                        <MapPin size={17} aria-hidden="true" />
                                        <strong>{address.label}</strong>
                                        {address.isDefault && <span className="profile-default-badge"><Check size={13} aria-hidden="true" /> Default</span>}
                                    </div>
                                    <div className="profile-address-actions">
                                        {!address.isDefault && <button type="button" onClick={() => setDefaultAddress(address._id)}>Set default</button>}
                                        <button type="button" aria-label={`Edit ${address.label} address`} onClick={() => openEditAddress(address)}><Pencil size={16} aria-hidden="true" /></button>
                                        <button type="button" className="profile-delete-button" aria-label={`Delete ${address.label} address`} onClick={() => deleteAddress(address._id)}><Trash2 size={16} aria-hidden="true" /></button>
                                    </div>
                                </div>
                                <address>
                                    <strong>{address.name}</strong>
                                    <span>{address.addressLine}</span>
                                    {address.landmark && <span>Near {address.landmark}</span>}
                                    <span>{address.city}, {address.pincode}</span>
                                    <span>+91 {address.phone}</span>
                                </address>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="profile-empty-address">
                        <MapPin size={22} aria-hidden="true" />
                        <p>No saved addresses yet.</p>
                        <button type="button" className="profile-secondary-button" onClick={openNewAddress}>Add your first address</button>
                    </div>
                )}

                {addressForm && (
                    <form className="profile-form profile-address-form" onSubmit={saveAddress}>
                        <div className="profile-form-title">
                            <h3>{editingAddressId ? 'Edit address' : 'Add a new address'}</h3>
                            <button type="button" className="profile-icon-button" aria-label="Close address form" onClick={() => { setAddressForm(null); setEditingAddressId(null); }}><X size={18} aria-hidden="true" /></button>
                        </div>
                        <div className="profile-form-grid">
                            <label>Save address as
                                <select required value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })}>
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>
                            <label>Contact name
                                <input required maxLength={100} autoComplete="name" value={addressForm.name} onChange={(event) => setAddressForm({ ...addressForm, name: event.target.value })} />
                            </label>
                            <label>Mobile number
                                <input required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} autoComplete="tel-national" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} />
                            </label>
                            <label className="profile-form-wide">House, street, area
                                <textarea required minLength={5} maxLength={250} autoComplete="street-address" value={addressForm.addressLine} onChange={(event) => setAddressForm({ ...addressForm, addressLine: event.target.value })} />
                            </label>
                            <label>Landmark <span className="profile-optional">Optional</span>
                                <input maxLength={120} value={addressForm.landmark} onChange={(event) => setAddressForm({ ...addressForm, landmark: event.target.value })} />
                            </label>
                            <label>PIN code
                                <input required inputMode="numeric" pattern="[1-9][0-9]{5}" minLength={6} maxLength={6} autoComplete="postal-code" value={addressForm.pincode} onChange={(event) => setAddressForm({ ...addressForm, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) })} />
                            </label>
                            <label>City
                                <select required value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })}>
                                    <option value="">Choose city</option>
                                    <option value="Lucknow">Lucknow</option>
                                    <option value="Azamgarh">Azamgarh</option>
                                    <option value="Kanpur">Kanpur</option>
                                    <option value="Gorakhpur">Gorakhpur</option>
                                </select>
                            </label>
                        </div>
                        <label className="profile-default-checkbox">
                            <input type="checkbox" checked={Boolean(addressForm.isDefault)} onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} />
                            <span>Set as my default delivery address</span>
                        </label>
                        <div className="profile-form-actions">
                            <button type="button" className="profile-secondary-button" onClick={() => { setAddressForm(null); setEditingAddressId(null); }}>Cancel</button>
                            <button type="submit" className="profile-primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : editingAddressId ? 'Save address' : 'Add address'}</button>
                        </div>
                    </form>
                )}
            </section>
        </main>
    )
}

export default Profile