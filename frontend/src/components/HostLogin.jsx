function HostLogin({ password, setPassword, loginHost }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <input
        placeholder="Host password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={loginHost}>Login as Host</button>
    </div>
  );
}

export default HostLogin;
