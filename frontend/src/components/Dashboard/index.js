import React, { useEffect, useState } from 'react';
import { Table, Input, Empty, Select, Statistic, Row, Col } from 'antd';
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Search } = Input;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB', '#FFCE56', '#FFA07A', '#8A2BE2', '#A52A2A'];

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSaleAmount: 0, totalSoldItems: 0, totalNotSoldItems: 0 });
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    fetchProducts("March");
    fetchStats("March");
    fetchPieData("March");
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchProducts(selectedMonth);
      fetchStats(selectedMonth);
      fetchPieData(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchProducts = async (month) => {
    try {
      const response = await axios.get(`http://localhost:5000/products/${month}`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products: ", error);
      setLoading(false);
    }
  };

  const handleSearch = async (searchedInput) => {
    try {
      if (searchedInput) {
        const result = await axios.get(`http://localhost:5000/search/${searchedInput}`);
        setData(result.data);
      } else {
        fetchProducts(selectedMonth); // Fetch products for the selected month if search input is empty
      }
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
  };

  const fetchStats = async (month) => {
    try {
      const response = await axios.get(`http://localhost:5000/stats/${month}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics: ", error);
    }
  };

  const fetchPieData = async (month) => {
    try {
      const response = await axios.get(`http://localhost:5000/pie-chart/${month}`);
      setPieData(response.data);
    } catch (error) {
      console.error("Error fetching pie chart data: ", error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (text) => <span>${text.toFixed(2)}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (text) => <img src={text} alt="Product" style={{ width: '50px' }} />,
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      key: 'sold',
      render: (text) => text ? 'Yes' : 'No',
    },
    {
      title: 'Date of Sale',
      dataIndex: 'dateOfSale',
      key: 'dateOfSale',
      render: (text) => new Date(text).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Dashboard</h1>
      <Search
        placeholder="Search products"
        allowClear
        enterButton="Search"
        size="large"
        onSearch={handleSearch}
        style={{ marginBottom: '20px' }}
      />
      <Select
        value={selectedMonth}
        placeholder="Select a month"
        style={{ width: 200, marginBottom: '20px' }}
        onChange={handleMonthChange}
      >
        <Option value="January">January</Option>
        <Option value="February">February</Option>
        <Option value="March">March</Option>
        <Option value="April">April</Option>
        <Option value="May">May</Option>
        <Option value="June">June</Option>
        <Option value="July">July</Option>
        <Option value="August">August</Option>
        <Option value="September">September</Option>
        <Option value="October">October</Option>
        <Option value="November">November</Option>
        <Option value="December">December</Option>
      </Select>
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={8}>
          <Statistic title="Total Sale Amount" value={`$${stats.totalSaleAmount.toFixed(2)}`} />
        </Col>
        <Col span={8}>
          <Statistic title="Total Sold Items" value={stats.totalSoldItems} />
        </Col>
        <Col span={8}>
          <Statistic title="Total Not Sold Items" value={stats.totalNotSoldItems} />
        </Col>
      </Row>
      {data.length > 0 ? (
        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading} 
          rowKey="id" 
          pagination={{ pageSize: 10 }} 
          size="middle" 
          bordered 
        />
      ) : (
        <Empty description="No products found" />
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        {pieData.length > 0 ? (
          <ResponsiveContainer width={400} height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="count"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="No data for pie chart" />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
