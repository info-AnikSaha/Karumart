import React, { useState } from "react";

const CreateStore = () => {
  const [store, setStore] = useState({
    storeName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });

  const handleChange = (e) => {
    setStore({
      ...store,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const stores =
      JSON.parse(localStorage.getItem("stores")) || [];

    stores.push(store);

    localStorage.setItem("stores", JSON.stringify(stores));

    alert("Store Created Successfully!");

    setStore({
      storeName: "",
      ownerName: "",
      email: "",
      phone: "",
      address: "",
      description: "",
    });
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Create Seller Store</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Store Name</label>
            <input
              type="text"
              className="form-control"
              name="storeName"
              value={store.storeName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Owner Name</label>
            <input
              type="text"
              className="form-control"
              name="ownerName"
              value={store.ownerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={store.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className="form-control"
              name="phone"
              value={store.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-control"
              name="address"
              value={store.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="4"
              name="description"
              value={store.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100"
          >
            Create Store
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStore;
